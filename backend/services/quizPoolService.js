// Quiz Pool Service - Manages quiz pool operations and distribution
const QuizPool = require('../models/QuizPool');
const UserQuizHistory = require('../models/UserQuizHistory');
const QuizRAGService = require('./quizRagService');
// Using crypto for UUID generation instead of uuid package
const crypto = require('crypto');

class QuizPoolService {
    constructor() {
        this.quizRAGService = null;
        this.initialized = false;
        this.minPoolSize = 50; // Minimum number of quizzes to maintain in pool
        this.targetPoolSize = 100; // Target pool size
        this.generationInProgress = false;
    }

    /**
     * Initialize the service
     */
    async initialize() {
        try {
            this.quizRAGService = new QuizRAGService();
            await this.quizRAGService.initialize();
            this.initialized = true;
            console.log('✅ Quiz Pool Service initialized');
            
            // Start maintenance tasks
            this._startMaintenanceTasks();
        } catch (error) {
            console.error('❌ Error initializing Quiz Pool Service:', error);
            throw error;
        }
    }

    /**
     * Get the next available quiz for a user
     * @param {string} userId - User ID
     * @param {Object} options - Quiz preferences
     * @returns {Object} Quiz data or null if need to generate
     */
    async getQuizForUser(userId, options = {}) {
        try {
            console.log(`🎯 Getting quiz for user ${userId}`);
            
            // Get or create user's quiz history
            const userHistory = await UserQuizHistory.findOrCreateForUser(userId);
            
            // Check if user has a valid current assignment
            if (userHistory.hasValidAssignment()) {
                console.log(`📋 User has valid assignment: ${userHistory.currentAssignment.assignedQuizId}`);
                const assignedQuiz = await QuizPool.findOne({ 
                    quizId: userHistory.currentAssignment.assignedQuizId,
                    isActive: true 
                });
                
                if (assignedQuiz) {
                    return this._formatQuizForUser(assignedQuiz);
                }
            }
            
            // Find available quizzes for the user
            const difficulty = options.difficulty || userHistory.preferences.preferredDifficulty || 'intermediate';
            const availableQuizzes = await QuizPool.findAvailableForUser(userId, difficulty === 'adaptive' ? null : difficulty, 10);
            
            if (availableQuizzes.length > 0) {
                // Select the oldest quiz to ensure fair distribution
                const selectedQuiz = availableQuizzes[0];
                
                // Assign this quiz to the user
                await userHistory.assignQuiz(selectedQuiz.quizId, 24); // 24 hour expiration
                
                console.log(`✅ Assigned existing quiz ${selectedQuiz.quizId} to user ${userId}`);
                return this._formatQuizForUser(selectedQuiz);
            }
            
            // No available quiz found - need to generate new one
            console.log(`📝 No available quiz for user ${userId}, will generate new quiz`);
            return null;
            
        } catch (error) {
            console.error('❌ Error getting quiz for user:', error);
            throw error;
        }
    }

    /**
     * Generate a new quiz and add it to the pool
     * @param {Object} options - Generation options
     * @returns {Object} Generated quiz
     */
    async generateAndAddQuiz(options = {}) {
        try {
            if (this.generationInProgress) {
                throw new Error('Quiz generation already in progress');
            }
            
            this.generationInProgress = true;
            console.log('🔄 Generating new quiz for pool...');
            
            const questionCount = options.questionCount || 30;
            const difficulty = options.difficulty || 'intermediate';
            
            // Generate questions using RAG service
            let quizQuestions = [];
            let generationMethod = 'ai-fallback';
            let ragSources = [];
            
            if (this.quizRAGService && this.quizRAGService.initialized) {
                try {
                    const domainContent = await this.quizRAGService.getAllDomainContent(questionCount);
                    quizQuestions = await this._generateQuestionsWithRAG(domainContent);
                    generationMethod = 'rag-enhanced';
                    
                    // Track RAG sources used
                    ragSources = this._extractRAGSources(domainContent);
                } catch (error) {
                    console.warn('⚠️ RAG generation failed, falling back to AI generation');
                    quizQuestions = await this._generateQuestionsWithAI(questionCount, difficulty);
                }
            } else {
                quizQuestions = await this._generateQuestionsWithAI(questionCount, difficulty);
            }
            
            // Create quiz pool entry
            const quizId = this._generateQuizId();
            const distribution = this._calculateDistribution(quizQuestions);
            
            const quizPoolEntry = new QuizPool({
                quizId,
                questions: quizQuestions,
                metadata: {
                    totalQuestions: quizQuestions.length,
                    difficulty,
                    distribution,
                    generationMethod,
                    ragSources,
                    qualityScore: this._calculateQualityScore(quizQuestions)
                },
                usedBy: [],
                isActive: true,
                usageStats: {
                    totalUses: 0,
                    averageScore: 0,
                    averageCompletionTime: 0,
                    difficultyRating: 5
                },
                createdBy: 'ai-generator'
            });
            
            await quizPoolEntry.save();
            
            console.log(`✅ Generated and saved quiz ${quizId} to pool`);
            this.generationInProgress = false;
            
            return this._formatQuizForUser(quizPoolEntry);
            
        } catch (error) {
            console.error('❌ Error generating quiz for pool:', error);
            this.generationInProgress = false;
            throw error;
        }
    }

    /**
     * Mark a quiz as used by a user and update statistics
     * @param {string} userId - User ID
     * @param {string} quizId - Quiz ID
     * @param {Object} results - Quiz results
     */
    async markQuizAsUsed(userId, quizId, results) {
        try {
            const { score, percentage, durationMinutes } = results;
            
            // Update quiz pool entry
            const quizPoolEntry = await QuizPool.findOne({ quizId });
            if (quizPoolEntry) {
                await quizPoolEntry.markAsUsed(userId, score, percentage, durationMinutes);
            }
            
            // Update user's quiz history
            const userHistory = await UserQuizHistory.findOrCreateForUser(userId);
            await userHistory.addCompletedQuiz({
                quizId,
                score,
                percentage,
                durationMinutes,
                quizResultId: results.quizResultId
            });
            
            console.log(`✅ Marked quiz ${quizId} as used by user ${userId}`);
            
        } catch (error) {
            console.error('❌ Error marking quiz as used:', error);
            throw error;
        }
    }

    /**
     * Get quiz pool statistics
     */
    async getPoolStats() {
        try {
            const stats = await QuizPool.getPoolStats();
            return {
                ...stats,
                poolHealth: this._assessPoolHealth(stats),
                needsGeneration: stats.totalActiveQuizzes < this.minPoolSize
            };
        } catch (error) {
            console.error('❌ Error getting pool stats:', error);
            throw error;
        }
    }

    /**
     * Maintain pool size by generating quizzes when needed
     */
    async maintainPoolSize() {
        try {
            const stats = await QuizPool.getPoolStats();
            
            if (stats.totalActiveQuizzes < this.minPoolSize && !this.generationInProgress) {
                const needed = this.targetPoolSize - stats.totalActiveQuizzes;
                console.log(`🔧 Pool maintenance: generating ${needed} quizzes`);
                
                // Generate multiple quizzes with different difficulties
                const difficulties = ['beginner', 'intermediate', 'advanced'];
                const promises = [];
                
                for (let i = 0; i < needed; i++) {
                    const difficulty = difficulties[i % difficulties.length];
                    promises.push(this.generateAndAddQuiz({ difficulty }));
                    
                    // Add delay between generations to avoid overwhelming the system
                    if (i > 0 && i % 5 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
                
                await Promise.all(promises);
                console.log(`✅ Pool maintenance completed: generated ${needed} quizzes`);
            }
        } catch (error) {
            console.error('❌ Error maintaining pool size:', error);
        }
    }

    /**
     * Perform quiz pool cleanup and maintenance
     */
    async performMaintenance() {
        try {
            console.log('🧹 Performing quiz pool maintenance...');
            
            // Clean up old/low-quality quizzes
            const cleanupResults = await QuizPool.performMaintenance();
            
            // Maintain pool size
            await this.maintainPoolSize();
            
            console.log('✅ Quiz pool maintenance completed:', cleanupResults);
            return cleanupResults;
            
        } catch (error) {
            console.error('❌ Error performing maintenance:', error);
            throw error;
        }
    }

    // Private methods

    /**
     * Validate and sanitize difficulty values
     */
    _validateDifficulty(difficulty) {
        const validDifficulties = ['beginner', 'intermediate', 'advanced'];
        
        // Direct match
        if (validDifficulties.includes(difficulty)) {
            return difficulty;
        }
        
        // Map common alternative values
        const difficultyMap = {
            'easy': 'beginner',
            'basic': 'beginner',
            'simple': 'beginner',
            'medium': 'intermediate',
            'normal': 'intermediate',
            'standard': 'intermediate',
            'hard': 'advanced',
            'difficult': 'advanced',
            'expert': 'advanced',
            'challenging': 'advanced'
        };
        
        const lowerDifficulty = difficulty?.toLowerCase();
        if (difficultyMap[lowerDifficulty]) {
            console.log(`⚠️ Mapping difficulty "${difficulty}" to "${difficultyMap[lowerDifficulty]}"`);
            return difficultyMap[lowerDifficulty];
        }
        
        // Default fallback
        console.log(`⚠️ Invalid difficulty "${difficulty}", defaulting to "intermediate"`);
        return 'intermediate';
    }

    /**
     * Sanitize questions after AI generation
     */
    _sanitizeQuestions(questions) {
        return questions.map(question => {
            return {
                ...question,
                difficulty: this._validateDifficulty(question.difficulty || 'intermediate')
            };
        });
    }

    /**
     * Format quiz for user consumption (remove correct answers and explanations)
     */
    _formatQuizForUser(quizPoolEntry) {
        const userQuestions = quizPoolEntry.questions.map(q => ({
            question: q.question,
            options: q.options,
            competencyArea: q.competencyArea,
            skillTopic: q.skillTopic,
            // Don't include correctAnswer or explanation for active quiz
        }));

        return {
            quizId: quizPoolEntry.quizId,
            questions: userQuestions,
            metadata: {
                totalQuestions: quizPoolEntry.metadata.totalQuestions,
                difficulty: quizPoolEntry.metadata.difficulty,
                generationMethod: quizPoolEntry.metadata.generationMethod
            },
            // Include the full questions with answers for result verification (server-side only)
            _fullQuestions: quizPoolEntry.questions
        };
    }

    /**
     * Generate quiz ID
     */
    _generateQuizId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex');
        return `quiz_${timestamp}_${random}`;
    }

    /**
     * Calculate question distribution by competency area
     */
    _calculateDistribution(questions) {
        const distribution = {
            physicalCareSkills: 0,
            psychosocialCareSkills: 0,
            roleOfNurseAide: 0
        };

        questions.forEach(q => {
            switch (q.competencyArea) {
                case 'Physical Care Skills':
                    distribution.physicalCareSkills++;
                    break;
                case 'Psychosocial Care Skills':
                    distribution.psychosocialCareSkills++;
                    break;
                case 'Role of the Nurse Aide':
                    distribution.roleOfNurseAide++;
                    break;
            }
        });

        return distribution;
    }

    /**
     * Calculate quality score for generated questions
     */
    _calculateQualityScore(questions) {
        let score = 70; // Base score
        
        // Check for proper distribution (should follow 64%, 10%, 26% roughly)
        const distribution = this._calculateDistribution(questions);
        const total = questions.length;
        const physicalPct = (distribution.physicalCareSkills / total) * 100;
        const psychosocialPct = (distribution.psychosocialCareSkills / total) * 100;
        const rolePct = (distribution.roleOfNurseAide / total) * 100;
        
        // Penalty for deviation from target distribution
        const physicalDev = Math.abs(physicalPct - 64);
        const psychosocialDev = Math.abs(psychosocialPct - 10);
        const roleDev = Math.abs(rolePct - 26);
        
        const distributionPenalty = (physicalDev + psychosocialDev + roleDev) / 3;
        score -= distributionPenalty;
        
        // Check question completeness
        let completenessScore = 100;
        questions.forEach(q => {
            if (!q.question || !q.options || !q.correctAnswer || !q.explanation) {
                completenessScore -= 10;
            }
            if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) {
                completenessScore -= 5;
            }
        });
        
        score = Math.max(0, Math.min(100, (score + completenessScore) / 2));
        
        return Math.round(score);
    }

    /**
     * Extract RAG sources from domain content
     */
    _extractRAGSources(domainContent) {
        const sources = [];
        
        Object.values(domainContent).forEach(domain => {
            domain.content.forEach(chunk => {
                sources.push({
                    contentId: chunk.id,
                    relevanceScore: chunk.score || 0
                });
            });
        });
        
        return sources.slice(0, 20); // Limit to top 20 sources
    }

    /**
     * Generate questions with RAG enhancement
     */
    async _generateQuestionsWithRAG(domainContent) {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });
        
        const allQuestions = [];
        
        // Generate questions for each domain
        for (const [domainKey, domainInfo] of Object.entries(domainContent)) {
            if (domainInfo.content && domainInfo.content.length > 0) {
                const contentSummary = this.quizRAGService.formatContentForPrompt(domainInfo.content);
                const domainQuestions = await this._generateDomainQuestions(
                    model,
                    domainInfo.domain,
                    domainInfo.questionCount,
                    contentSummary
                );
                
                // Questions are already sanitized in _generateDomainQuestions
                allQuestions.push(...domainQuestions);
            }
        }
        
        return allQuestions;
    }

    /**
     * Generate questions for a specific domain using RAG content
     */
    async _generateDomainQuestions(model, domain, questionCount, contentSummary) {
        const prompt = `Based on the following CNA training content, generate exactly ${questionCount} certification exam questions for the "${domain}" competency area.

${contentSummary}

REQUIREMENTS:
- Each question must be multiple choice with exactly 4 options (A, B, C, D)
- Questions should be based on the reference content provided above
- Use realistic scenarios that CNAs encounter in practice
- One correct answer per question
- Incorrect options should be plausible but clearly wrong
- Questions should reflect certification exam difficulty level
- Include both knowledge-based and scenario-based questions
- Add specific skill topics within the domain
- IMPORTANT: difficulty must be exactly one of: "beginner", "intermediate", or "advanced" (no other values allowed)

STRICT JSON FORMAT - Return ONLY a valid JSON array:
[
  {
    "question": "Question text here based on the reference content",
    "options": {
      "A": "Option A text",
      "B": "Option B text", 
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A",
    "competencyArea": "${domain}",
    "skillTopic": "Specific skill topic within domain",
    "difficulty": "intermediate",
    "explanation": "Brief explanation referencing the training content"
  }
]

Generate exactly ${questionCount} questions. Return ONLY the JSON array, no other text.`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let generatedText = response.text().trim();
            
            // Clean up JSON
            if (generatedText.startsWith('```json')) {
                generatedText = generatedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (generatedText.startsWith('```')) {
                generatedText = generatedText.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            const questions = JSON.parse(generatedText);
            
            if (Array.isArray(questions)) {
                const sanitizedQuestions = this._sanitizeQuestions(questions.slice(0, questionCount));
                return sanitizedQuestions;
            } else {
                console.error('❌ Invalid response format for domain questions');
                return [];
            }
        } catch (error) {
            console.error(`❌ Error generating questions for ${domain}:`, error);
            return [];
        }
    }

    /**
     * Generate questions with AI fallback (no RAG)
     */
    async _generateQuestionsWithAI(questionCount, difficulty) {
        // Use existing fallback generation logic
        const { generateFallbackQuestions } = require('../controllers/quizController');
        return generateFallbackQuestions(questionCount);
    }

    /**
     * Assess pool health
     */
    _assessPoolHealth(stats) {
        let score = 100;
        
        if (stats.totalActiveQuizzes < this.minPoolSize) {
            score -= 30;
        }
        
        if (stats.averageQualityScore < 70) {
            score -= 20;
        }
        
        if (stats.averageDifficultyRating < 3 || stats.averageDifficultyRating > 8) {
            score -= 15;
        }
        
        return {
            score: Math.max(0, score),
            status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
        };
    }

    /**
     * Start background maintenance tasks
     */
    _startMaintenanceTasks() {
        // Run maintenance every 6 hours
        setInterval(() => {
            this.performMaintenance().catch(error => {
                console.error('❌ Scheduled maintenance failed:', error);
            });
        }, 6 * 60 * 60 * 1000);
        
        console.log('🔧 Started background maintenance tasks');
    }
}

module.exports = QuizPoolService;