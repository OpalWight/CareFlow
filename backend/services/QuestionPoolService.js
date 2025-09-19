// Question Pool Service - Manages individual question selection and generation
const QuestionBank = require('../models/QuestionBank');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const UserQuizPreferences = require('../models/UserQuizPreferences');
const QuizSession = require('../models/QuizSession');
const QuizRAGService = require('./quizRagService');
const crypto = require('crypto');
const { SKILL_TOPICS, TEST_SUBJECTS, SKILL_TOPIC_MAPPINGS, TEST_SUBJECT_MAPPINGS } = require('../constants/questionEnums');

class QuestionPoolService {
    constructor() {
        this.quizRAGService = null;
        this.initialized = false;
        this.minQuestionPoolSize = 200; // Minimum questions to maintain per competency area
        this.generationInProgress = false;
        
        // Question selection weights
        this.selectionWeights = {
            newQuestion: 0.4,        // Prioritize unasked questions
            weakArea: 0.3,          // Focus on user's weak areas
            spacedRepetition: 0.2,  // Include spaced repetition
            randomSelection: 0.1    // Some randomness for variety
        };
    }

    /**
     * Initialize the service
     */
    async initialize() {
        try {
            this.quizRAGService = new QuizRAGService();
            await this.quizRAGService.initialize();
            this.initialized = true;
            console.log('✅ Question Pool Service initialized');
            
            // Start maintenance tasks
            this._startMaintenanceTasks();
        } catch (error) {
            console.error('❌ Error initializing Question Pool Service:', error);
            // Continue without RAG service if it fails
            this.initialized = true;
        }
    }

    /**
     * Create a new quiz session with selected questions
     * @param {string} userId - User ID
     * @param {Object} preferences - Quiz preferences (optional, will use user's saved preferences if not provided)
     * @returns {Object} Quiz session data
     */
    async createQuizSession(userId, preferences = null) {
        try {
            console.log(`[QUIZ-DEBUG] 🎯 Creating quiz session for user ${userId}`);
            
            // Get user preferences with proper error handling
            let userPrefs = preferences;
            if (!userPrefs) {
                console.log(`[QUIZ-DEBUG] 🔍 Fetching user preferences for user ${userId}...`);
                userPrefs = await UserQuizPreferences.findOrCreateForUser(userId);
                console.log(`[QUIZ-DEBUG] 📋 User preferences retrieved:`, {
                    hasCalculateMethod: typeof userPrefs.calculateQuestionDistribution === 'function',
                    isMongooseDoc: userPrefs.constructor.name,
                    questionCount: userPrefs.quizComposition?.questionCount,
                    difficulty: userPrefs.difficultySettings?.preferredDifficulty,
                    userId: userId
                });
            } else {
                console.log(`[QUIZ-DEBUG] 📋 Using custom preferences for user ${userId}:`, {
                    questionCount: userPrefs.quizComposition?.questionCount,
                    difficulty: userPrefs.difficultySettings?.preferredDifficulty,
                    hasCompetencyRatios: !!userPrefs.quizComposition?.competencyRatios
                });
            }
            
            // Ensure userPrefs has the calculateQuestionDistribution method
            if (!userPrefs.calculateQuestionDistribution || typeof userPrefs.calculateQuestionDistribution !== 'function') {
                console.warn(`[QUIZ-DEBUG] ⚠️ UserPrefs missing calculateQuestionDistribution method for user ${userId}, using default distribution`);
                // Fallback to manual calculation
                const questionCount = userPrefs.quizComposition?.questionCount || 30;
                const ratios = userPrefs.quizComposition?.competencyRatios || {
                    physicalCareSkills: 64,
                    psychosocialCareSkills: 10,
                    roleOfNurseAide: 26
                };
                
                const distribution = {
                    'Physical Care Skills': Math.round((ratios.physicalCareSkills / 100) * questionCount),
                    'Psychosocial Care Skills': Math.round((ratios.psychosocialCareSkills / 100) * questionCount),
                    'Role of the Nurse Aide': Math.round((ratios.roleOfNurseAide / 100) * questionCount)
                };
                
                console.log(`[DEBUG] Manual question distribution:`, distribution);
                
                // Select questions for the quiz
                const selectedQuestions = await this._selectQuestions(userId, userPrefs, distribution);
                
                if (selectedQuestions.length === 0) {
                    throw new Error('No suitable questions found for quiz generation');
                }
                
                // Create new quiz session with manual distribution
                const sessionId = QuizSession.generateSessionId();
                const session = new QuizSession({
                    sessionId,
                    userId,
                    configuration: {
                        questionCount: questionCount,
                        competencyDistribution: distribution,
                        difficulty: userPrefs.difficultySettings?.preferredDifficulty || 'intermediate',
                        quizType: 'practice',
                        settings: {
                            includeReviewQuestions: userPrefs.learningPreferences?.includeReviewQuestions || true,
                            avoidRecentQuestions: userPrefs.learningPreferences?.avoidRecentQuestions || true,
                            prioritizeWeakAreas: userPrefs.learningPreferences?.focusOnWeakAreas || true,
                            includeSpacedRepetition: userPrefs.learningPreferences?.includeSpacedRepetition || true
                        }
                    },
                    questions: selectedQuestions,
                    appliedPreferences: {
                        difficultyAdjustment: userPrefs.difficultySettings?.adaptiveSettings?.enabled || true,
                        focusOnWeakAreas: userPrefs.learningPreferences?.focusOnWeakAreas || true,
                        includeReview: userPrefs.learningPreferences?.includeReviewQuestions || true,
                        avoidRecent: userPrefs.learningPreferences?.avoidRecentQuestions || true,
                        spacedRepetition: userPrefs.learningPreferences?.includeSpacedRepetition || true
                    }
                });
                
                await session.save();
                
                console.log(`✅ Created quiz session ${sessionId} with ${selectedQuestions.length} questions (manual fallback)`);
                return this._formatSessionForUser(session);
            }
            
            // Check for existing active session
            const existingSession = await QuizSession.findActiveSession(userId);
            if (existingSession) {
                console.log(`📋 Found existing active session: ${existingSession.sessionId}`);
                return this._formatSessionForUser(existingSession);
            }
            
            // Calculate question distribution using the proper method
            console.log(`🧮 Calculating question distribution...`);
            const distribution = userPrefs.calculateQuestionDistribution();
            console.log(`[DEBUG] Question distribution:`, distribution);
            
            // Select questions for the quiz
            const selectedQuestions = await this._selectQuestions(userId, userPrefs, distribution);
            
            if (selectedQuestions.length === 0) {
                throw new Error('No suitable questions found for quiz generation');
            }
            
            // Create new quiz session
            const sessionId = QuizSession.generateSessionId();
            const session = new QuizSession({
                sessionId,
                userId,
                configuration: {
                    questionCount: userPrefs.quizComposition?.questionCount || 30,
                    competencyDistribution: distribution,
                    difficulty: userPrefs.difficultySettings?.preferredDifficulty || 'intermediate',
                    quizType: 'practice',
                    settings: {
                        includeReviewQuestions: userPrefs.learningPreferences?.includeReviewQuestions || true,
                        avoidRecentQuestions: userPrefs.learningPreferences?.avoidRecentQuestions || true,
                        prioritizeWeakAreas: userPrefs.learningPreferences?.focusOnWeakAreas || true,
                        includeSpacedRepetition: userPrefs.learningPreferences?.includeSpacedRepetition || true
                    }
                },
                questions: selectedQuestions,
                appliedPreferences: {
                    difficultyAdjustment: userPrefs.difficultySettings?.adaptiveSettings?.enabled || true,
                    focusOnWeakAreas: userPrefs.learningPreferences?.focusOnWeakAreas || true,
                    includeReview: userPrefs.learningPreferences?.includeReviewQuestions || true,
                    avoidRecent: userPrefs.learningPreferences?.avoidRecentQuestions || true,
                    spacedRepetition: userPrefs.learningPreferences?.includeSpacedRepetition || true
                }
            });
            
            await session.save();
            
            console.log(`✅ Created quiz session ${sessionId} with ${selectedQuestions.length} questions`);
            return this._formatSessionForUser(session);
            
        } catch (error) {
            console.error('❌ Error creating quiz session:', error);
            throw error;
        }
    }

    /**
     * Submit answer for a question in a quiz session
     * @param {string} sessionId - Quiz session ID
     * @param {string} questionId - Question ID
     * @param {string} selectedAnswer - User's selected answer (A, B, C, D)
     * @param {number} timeSpent - Time spent on question in seconds
     * @returns {Object} Answer result with feedback
     */
    async submitAnswer(sessionId, questionId, selectedAnswer, timeSpent = 0) {
        try {
            console.log(`📝 Submitting answer for question ${questionId} in session ${sessionId}`);
            
            // Get the quiz session
            const session = await QuizSession.findOne({ sessionId, status: 'active' });
            if (!session) {
                throw new Error('Quiz session not found or not active');
            }
            
            // Get the correct answer from QuestionBank
            const question = await QuestionBank.findOne({ questionId, status: 'active' });
            if (!question) {
                throw new Error('Question not found');
            }
            
            const isCorrect = selectedAnswer === question.correctAnswer;
            
            // Record the answer in the session
            await session.answerQuestion(questionId, selectedAnswer, timeSpent);
            
            // Update session progress with correct answer
            await session.updateProgress(questionId, isCorrect);
            
            // Update question usage statistics
            await question.updateUsageStats(isCorrect, timeSpent);
            
            // Update user's question progress
            const userProgress = await UserQuestionProgress.findOrCreate(session.userId, questionId);
            await userProgress.recordAttempt({
                selectedAnswer,
                isCorrect,
                timeSpent,
                difficultyLevel: question.difficulty,
                context: {
                    quizSessionId: sessionId,
                    position: session.questions.find(q => q.questionId === questionId)?.position,
                    totalQuestions: session.configuration.questionCount
                }
            });
            
            console.log(`✅ Recorded answer for question ${questionId}: ${isCorrect ? 'correct' : 'incorrect'}`);
            
            // Return answer feedback
            return {
                isCorrect,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                currentScore: session.progress.currentScore,
                questionComplete: true
            };
            
        } catch (error) {
            console.error('❌ Error submitting answer:', error);
            throw error;
        }
    }

    /**
     * Complete a quiz session and return detailed results
     * @param {string} sessionId - Quiz session ID
     * @returns {Object} Complete quiz results
     */
    async completeQuizSession(sessionId) {
        try {
            console.log(`🏁 Completing quiz session ${sessionId}`);
            
            const session = await QuizSession.findOne({ sessionId, status: 'active' });
            if (!session) {
                throw new Error('Quiz session not found or not active');
            }
            
            // Complete the session
            await session.completeSession();
            
            // Generate detailed results
            const results = await this._generateSessionResults(session);
            
            // Update the session with results
            session.results = results;
            await session.save();
            
            console.log(`✅ Completed quiz session ${sessionId} - Score: ${results.finalScore.percentage}%`);
            
            return {
                sessionId,
                results,
                timing: session.timing,
                analytics: results.analytics
            };
            
        } catch (error) {
            console.error('❌ Error completing quiz session:', error);
            throw error;
        }
    }

    /**
     * Get current quiz session for user
     * @param {string} userId - User ID
     * @returns {Object|null} Current session or null
     */
    async getCurrentSession(userId) {
        const session = await QuizSession.findActiveSession(userId);
        return session ? this._formatSessionForUser(session) : null;
    }

    /**
     * Generate new questions when pool is running low
     * @param {Object} criteria - Generation criteria
     * @returns {Array} Generated questions
     */
    async generateQuestions(criteria = {}) {
        if (this.generationInProgress) {
            throw new Error('Question generation already in progress');
        }
        
        this.generationInProgress = true;
        
        try {
            console.log('🔄 Generating new questions for pool...');
            
            const {
                competencyArea = 'Physical Care Skills',
                skillCategory = 'Basic Nursing Skills',
                difficulty = 'intermediate',
                count = 10
            } = criteria;
            
            let generatedQuestions = [];
            
            // Try RAG-enhanced generation first
            if (this.quizRAGService && this.quizRAGService.initialized) {
                try {
                    console.log(`🔍 Attempting RAG-enhanced generation for ${competencyArea}...`);
                    generatedQuestions = await this._generateQuestionsWithRAG(criteria);
                    console.log(`✅ RAG generation successful: ${generatedQuestions.length} questions`);
                } catch (error) {
                    console.warn('⚠️ RAG generation failed:', {
                        error: error.message,
                        competencyArea,
                        skillCategory,
                        ragServiceStatus: this.quizRAGService?.initialized || 'not initialized'
                    });
                    console.log('🔄 Falling back to AI generation...');
                    generatedQuestions = await this._generateQuestionsWithAI(criteria);
                }
            } else {
                const ragStatus = this.quizRAGService ? 
                    `initialized: ${this.quizRAGService.initialized}` : 
                    'service not available';
                console.log(`⚠️ Skipping RAG generation - ${ragStatus}, using AI generation directly`);
                generatedQuestions = await this._generateQuestionsWithAI(criteria);
            }
            
            // Save generated questions to database
            const savedQuestions = [];
            for (const questionData of generatedQuestions) {
                const question = new QuestionBank({
                    questionId: this._generateQuestionId(),
                    ...questionData,
                    metadata: {
                        generationMethod: this.quizRAGService ? 'rag-enhanced' : 'ai-generated',
                        qualityScore: 70, // Initial quality score
                        ...questionData.metadata
                    }
                });
                
                await question.save();
                savedQuestions.push(question);
            }
            
            console.log(`✅ Generated and saved ${savedQuestions.length} questions`);
            return savedQuestions;
            
        } catch (error) {
            console.error('❌ Error generating questions:', error);
            throw error;
        } finally {
            this.generationInProgress = false;
        }
    }

    /**
     * Get question pool statistics
     */
    async getPoolStats() {
        try {
            const stats = await QuestionBank.getPoolStats();
            
            // Check which areas need more questions
            const recommendations = [];
            Object.entries(stats.competencyDistribution).forEach(([competency, data]) => {
                if (data.count < this.minQuestionPoolSize / 3) { // Rough distribution
                    recommendations.push({
                        area: competency,
                        needed: Math.ceil(this.minQuestionPoolSize / 3 - data.count),
                        priority: 'high'
                    });
                }
            });
            
            return {
                ...stats,
                recommendations,
                poolHealth: this._assessPoolHealth(stats)
            };
        } catch (error) {
            console.error('❌ Error getting pool stats:', error);
            throw error;
        }
    }

    // Private Methods

    /**
     * Select questions for a quiz based on user preferences and performance
     */
    async _selectQuestions(userId, userPrefs, distribution) {
        console.log(`[QUIZ-DEBUG] 🔍 Selecting questions for user ${userId}`);
        console.log(`[QUIZ-DEBUG] 📊 Question distribution requested:`, distribution);
        
        const selectedQuestions = [];
        let position = 1;
        
        // Get user's question progress for intelligent selection
        const startTime = Date.now();
        const userProgress = await UserQuestionProgress.find({ userId });
        const userProgressMap = new Map(userProgress.map(p => [p.questionId, p]));
        console.log(`[QUIZ-DEBUG] 📈 User progress loaded: ${userProgress.length} questions in ${Date.now() - startTime}ms`);
        
        // Get questions due for spaced repetition
        const dueQuestions = await UserQuestionProgress.findDueForReview(userId, 10);
        console.log(`[QUIZ-DEBUG] 🔄 Questions due for review: ${dueQuestions.length}`);
        
        // Select questions for each competency area
        let totalRequested = 0;
        let totalSelected = 0;
        
        for (const [competencyArea, count] of Object.entries(distribution)) {
            if (count === 0) {
                console.log(`[QUIZ-DEBUG] ⏭️ Skipping ${competencyArea} (0 questions requested)`);
                continue;
            }
            
            totalRequested += count;
            console.log(`[QUIZ-DEBUG] 🎯 Selecting ${count} questions for ${competencyArea}`);
            
            const competencyKey = this._mapCompetencyKey(competencyArea);
            const selectionStart = Date.now();
            
            const questions = await this._selectQuestionsForCompetency(
                userId,
                competencyKey,
                count,
                userPrefs,
                userProgressMap,
                dueQuestions
            );
            
            const selectionTime = Date.now() - selectionStart;
            console.log(`[QUIZ-DEBUG] ✅ Selected ${questions.length}/${count} questions for ${competencyArea} in ${selectionTime}ms`);
            
            if (questions.length < count) {
                console.warn(`[QUIZ-DEBUG] ⚠️ Question shortage for ${competencyArea}: got ${questions.length}, needed ${count}`);
            }
            
            totalSelected += questions.length;
            
            // Add questions with metadata
            questions.forEach(question => {
                selectedQuestions.push({
                    questionId: question.questionId,
                    position: position++,
                    selectionReason: this._getSelectionReason(question, userProgressMap, dueQuestions),
                    metadata: {
                        competencyArea: question.competencyArea,
                        skillCategory: question.skillCategory,
                        skillTopic: question.skillTopic,
                        testSubject: question.testSubject,
                        difficulty: question.difficulty,
                        qualityScore: question.metadata.qualityScore
                    }
                });
            });
        }
        
        console.log(`[QUIZ-DEBUG] 📋 Selection summary for user ${userId}:`, {
            totalRequested,
            totalSelected,
            shortfall: totalRequested - totalSelected,
            shortfallPercentage: Math.round(((totalRequested - totalSelected) / totalRequested) * 100),
            finalCount: selectedQuestions.length
        });
        
        if (totalSelected < totalRequested) {
            console.error(`[QUIZ-DEBUG] ❌ Insufficient questions: requested ${totalRequested}, got ${totalSelected}`);
        }
        
        // Shuffle questions to avoid predictable patterns
        const shuffledQuestions = this._shuffleArray(selectedQuestions);
        console.log(`[QUIZ-DEBUG] 🔀 Questions shuffled, returning ${shuffledQuestions.length} questions`);
        
        return shuffledQuestions;
    }

    /**
     * Select questions for a specific competency area
     */
    async _selectQuestionsForCompetency(userId, competencyArea, count, userPrefs, userProgressMap, dueQuestions) {
        console.log(`[QUIZ-DEBUG] 🔍 Selecting questions for competency: ${competencyArea}`);
        
        const criteria = {
            competencyArea,
            minQuality: 60,
            excludeRecent: userPrefs.learningPreferences?.avoidRecentQuestions || true,
            recentTimeframe: (userPrefs.learningPreferences?.recentQuestionTimeframe || 7) * 24 * 60 * 60 * 1000,
            limit: count * 3 // Get more questions than needed for better selection
        };
        
        // Apply difficulty preference
        if (userPrefs.difficultySettings?.preferredDifficulty && userPrefs.difficultySettings.preferredDifficulty !== 'adaptive') {
            criteria.difficulty = userPrefs.difficultySettings.preferredDifficulty;
        }
        
        console.log(`[QUIZ-DEBUG] 📋 Query criteria for ${competencyArea}:`, {
            competencyArea: criteria.competencyArea,
            minQuality: criteria.minQuality,
            difficulty: criteria.difficulty || 'any',
            excludeRecent: criteria.excludeRecent,
            recentTimeframeDays: Math.round(criteria.recentTimeframe / (24 * 60 * 60 * 1000)),
            limit: criteria.limit,
            requestedCount: count
        });
        
        const queryStart = Date.now();
        const availableQuestions = await QuestionBank.findByCriteria(criteria);
        const queryTime = Date.now() - queryStart;
        
        console.log(`[QUIZ-DEBUG] 🔍 Database query for ${competencyArea} completed in ${queryTime}ms:`, {
            found: availableQuestions.length,
            requested: count,
            criteria: criteria
        });
        
        if (availableQuestions.length === 0) {
            console.warn(`[QUIZ-DEBUG] ⚠️ No questions found for ${competencyArea}, attempting to generate new questions`);
            
            try {
                const generationStart = Date.now();
                await this.generateQuestions({ competencyArea, count: Math.max(count, 10) });
                const generationTime = Date.now() - generationStart;
                
                console.log(`[QUIZ-DEBUG] ✅ Generated questions for ${competencyArea} in ${generationTime}ms`);
                
                // Retry selection after generation
                const retryStart = Date.now();
                const retryQuestions = await QuestionBank.findByCriteria({ ...criteria, limit: count });
                const retryTime = Date.now() - retryStart;
                
                console.log(`[QUIZ-DEBUG] 🔄 Retry query for ${competencyArea} found ${retryQuestions.length} questions in ${retryTime}ms`);
                return retryQuestions;
            } catch (generationError) {
                console.error(`[QUIZ-DEBUG] ❌ Question generation failed for ${competencyArea}:`, generationError.message);
                return [];
            }
        }
        
        // Intelligent question selection
        const scoredQuestions = availableQuestions.map(question => {
            let score = 0;
            const userProgress = userProgressMap.get(question.questionId);
            
            // New questions get higher priority
            if (!userProgress) {
                score += this.selectionWeights.newQuestion * 100;
            }
            
            // Questions in weak areas get higher priority
            if (userProgress && userProgress.stats?.accuracy && userProgress.stats.accuracy < 70) {
                score += this.selectionWeights.weakArea * 100;
            }
            
            // Spaced repetition questions
            if (dueQuestions.some(q => q.questionId === question.questionId)) {
                score += this.selectionWeights.spacedRepetition * 100;
            }
            
            // Quality score factor
            score += (question.metadata?.qualityScore || 70) * 0.5;
            
            // Random factor for variety
            score += Math.random() * this.selectionWeights.randomSelection * 100;
            
            return { question, score };
        });
        
        // Sort by score and take the top questions
        scoredQuestions.sort((a, b) => b.score - a.score);
        return scoredQuestions.slice(0, count).map(sq => sq.question);
    }

    /**
     * Generate questions using RAG service
     */
    async _generateQuestionsWithRAG(criteria) {
        const { competencyArea, skillCategory, count = 10, difficulty = 'intermediate' } = criteria;
        
        // Check if the required method exists
        if (!this.quizRAGService.getContentForDomain || typeof this.quizRAGService.getContentForDomain !== 'function') {
            throw new Error('RAG service method getContentForDomain is not available');
        }
        
        // Get relevant content from RAG service
        const domainContent = await this.quizRAGService.getContentForDomain(competencyArea);
        
        if (!domainContent || domainContent.length === 0) {
            throw new Error('No content available for RAG generation');
        }
        
        // Generate questions using Gemini with RAG content
        return await this._generateQuestionsWithGemini(criteria, domainContent);
    }

    /**
     * Generate questions using AI without RAG
     */
    async _generateQuestionsWithAI(criteria) {
        return await this._generateQuestionsWithGemini(criteria);
    }

    /**
     * Generate questions using Gemini API
     */
    async _generateQuestionsWithGemini(criteria, ragContent = null) {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });
        
        const {
            competencyArea = 'Physical Care Skills',
            skillCategory = 'Basic Nursing Skills',
            difficulty = 'intermediate',
            count = 10
        } = criteria;
        
        let prompt = `Generate exactly ${count} CNA certification exam questions for the "${competencyArea}" competency area, specifically focusing on "${skillCategory}".`;
        
        if (ragContent) {
            prompt += `\n\nBase the questions on the following training content:\n${ragContent.slice(0, 2000)}`;
        }
        
        prompt += `

REQUIREMENTS:
- Each question must be multiple choice with exactly 4 options (A, B, C, D)
- Questions should be realistic scenarios that CNAs encounter
- Difficulty level: ${difficulty}
- One correct answer per question
- Include detailed explanations
- Questions must relate to specific skill topics within ${skillCategory}

CRITICAL REQUIREMENTS - You must use ONLY these exact values (case-sensitive):

skillTopic (specific nursing skill within the category - choose ONE):
${SKILL_TOPICS.map(topic => `- ${topic}`).join('\n')}

testSubject (broader exam category for certification - choose ONE):
${TEST_SUBJECTS.map(subject => `- ${subject}`).join('\n')}

IMPORTANT NOTES:
- skillTopic should be a SPECIFIC skill (like "Hygiene" or "Data Collection/Reporting")  
- testSubject should be a BROAD exam category (like "Personal care skills" or "Safety and emergency procedures")
- DO NOT mix these up - "CNA Responsibilities" goes in skillTopic, NOT testSubject
- These are two DIFFERENT classification systems

STRICT JSON FORMAT - Return ONLY a valid JSON array:
[
  {
    "question": "Question text here",
    "options": {
      "A": "Option A text",
      "B": "Option B text", 
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A",
    "competencyArea": "${competencyArea}",
    "skillCategory": "${skillCategory}",
    "skillTopic": "MUST be one of the exact values from the skillTopic list above",
    "testSubject": "MUST be one of the exact values from the testSubject list above",
    "difficulty": "${difficulty}",
    "explanation": "Detailed explanation of the correct answer"
  }
]

Generate exactly ${count} questions. Return ONLY the JSON array, no other text.`;

        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries} to generate questions...`);
                
                const result = await model.generateContent(prompt);
                const response = await result.response;
                let generatedText = response.text().trim();
                
                console.log(`📝 Raw AI response (first 200 chars): ${generatedText.substring(0, 200)}...`);
                
                // Clean up JSON with robust cleaning
                generatedText = this._cleanJsonResponse(generatedText);
                
                console.log(`🧹 Cleaned JSON (first 200 chars): ${generatedText.substring(0, 200)}...`);
                
                const questions = JSON.parse(generatedText);
                const validatedQuestions = Array.isArray(questions) ? questions.slice(0, count) : [];
                
                if (validatedQuestions.length === 0) {
                    throw new Error('No valid questions returned from AI');
                }
                
                // Fix question structure (move fields out of options object)
                const structureFixedQuestions = validatedQuestions.map(question => this._fixQuestionStructure(question));
                
                // Validate and fix enum values
                const finalQuestions = structureFixedQuestions.map(question => this._validateAndFixEnumValues(question));
                
                console.log(`✅ Successfully generated ${finalQuestions.length} questions on attempt ${attempt}`);
                return finalQuestions;
                
            } catch (error) {
                console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    console.error('💥 All attempts failed, returning empty array');
                    return [];
                }
                
                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
        }
        
        return [];
    }

    /**
     * Clean and fix malformed JSON responses from AI
     */
    _cleanJsonResponse(text) {
        console.log(`🔍 Original text length: ${text.length}`);
        
        // Step 1: Remove code block markers
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\s*/g, '').replace(/\s*```$/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\s*/g, '').replace(/\s*```$/g, '');
        }
        
        // Step 2: Extract JSON array content
        const firstBracket = cleaned.indexOf('[');
        const lastBracket = cleaned.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            cleaned = cleaned.substring(firstBracket, lastBracket + 1);
        }
        
        console.log(`🧹 After basic cleaning: ${cleaned.substring(0, 200)}...`);
        
        // Step 3: Try to parse as-is first (most AI responses are actually valid)
        try {
            JSON.parse(cleaned);
            console.log('✅ JSON is already valid, no additional cleaning needed');
            return cleaned;
        } catch (firstError) {
            console.log(`⚠️ Initial parse failed: ${firstError.message}`);
        }
        
        // Step 4: Progressive cleaning - only if parsing failed
        let progressivelyCleaned = cleaned;
        
        // Fix trailing commas (common issue)
        progressivelyCleaned = progressivelyCleaned.replace(/,(\s*[}\]])/g, '$1');
        
        try {
            JSON.parse(progressivelyCleaned);
            console.log('✅ Fixed with trailing comma removal');
            return progressivelyCleaned;
        } catch (secondError) {
            console.log(`⚠️ After comma fix: ${secondError.message}`);
        }
        
        // Fix missing commas between objects (less common)
        progressivelyCleaned = progressivelyCleaned
            .replace(/}(\s*{)/g, '},$1')
            .replace(/](\s*\[)/g, '],$1');
        
        try {
            JSON.parse(progressivelyCleaned);
            console.log('✅ Fixed with missing comma addition');
            return progressivelyCleaned;
        } catch (thirdError) {
            console.log(`⚠️ After comma addition: ${thirdError.message}`);
        }
        
        // Last resort: careful quote fixing (most dangerous operation)
        // Only fix obvious single quote issues, not apostrophes in text
        progressivelyCleaned = progressivelyCleaned
            // Fix single quotes around property names only
            .replace(/'([^']*)':/g, '"$1":')
            // Fix single quotes around simple string values (no apostrophes inside)
            .replace(/:\s*'([^']*?)'/g, ': "$1"');
        
        try {
            JSON.parse(progressivelyCleaned);
            console.log('✅ Fixed with careful quote replacement');
            return progressivelyCleaned;
        } catch (finalError) {
            console.error(`💥 All cleaning attempts failed: ${finalError.message}`);
            console.error(`🔍 Final cleaned text: ${progressivelyCleaned}`);
            throw new Error(`Unable to repair JSON: ${finalError.message}`);
        }
    }

    /**
     * Fix question structure by moving fields out of options object if they were misplaced
     */
    _fixQuestionStructure(question) {
        // If the AI put fields inside the options object, move them to the root level
        if (question.options && typeof question.options === 'object') {
            const fieldsToMove = ['correctAnswer', 'explanation', 'competencyArea', 'skillCategory', 'skillTopic', 'testSubject', 'difficulty'];
            
            fieldsToMove.forEach(field => {
                if (question.options[field] !== undefined && question[field] === undefined) {
                    console.log(`🔧 Moving ${field} from options to root level`);
                    question[field] = question.options[field];
                    delete question.options[field];
                }
            });
        }
        
        // Ensure required fields exist
        if (!question.explanation) {
            console.warn(`⚠️ Missing explanation field, adding default`);
            question.explanation = 'Please review this question for explanation completeness.';
        }
        
        return question;
    }

    /**
     * Validate and fix enum values for generated questions
     */
    _validateAndFixEnumValues(question) {
        // Fix skillTopic
        if (!SKILL_TOPICS.includes(question.skillTopic)) {
            const mapped = SKILL_TOPIC_MAPPINGS[question.skillTopic];
            if (mapped) {
                console.log(`🔧 Mapped skillTopic "${question.skillTopic}" to "${mapped}"`);
                question.skillTopic = mapped;
            } else {
                console.warn(`⚠️ Invalid skillTopic "${question.skillTopic}", using fallback`);
                question.skillTopic = 'Data Collection/Reporting'; // Safe fallback
            }
        }

        // Fix testSubject
        if (!TEST_SUBJECTS.includes(question.testSubject)) {
            const mapped = TEST_SUBJECT_MAPPINGS[question.testSubject];
            if (mapped) {
                console.log(`🔧 Mapped testSubject "${question.testSubject}" to "${mapped}"`);
                question.testSubject = mapped;
            } else {
                console.warn(`⚠️ Invalid testSubject "${question.testSubject}", using fallback`);
                question.testSubject = 'Personal care skills'; // Safe fallback
            }
        }

        return question;
    }

    /**
     * Generate detailed results for a completed session
     */
    async _generateSessionResults(session) {
        const questions = await QuestionBank.find({
            questionId: { $in: session.questions.map(q => q.questionId) }
        });
        
        const questionMap = new Map(questions.map(q => [q.questionId, q]));
        
        // Calculate final results
        const finalScore = {
            correct: session.progress.currentScore.correct,
            total: session.progress.currentScore.total,
            percentage: session.progress.currentScore.percentage
        };
        
        // Generate detailed question results
        const questionResults = session.progress.answeredQuestions.map(answer => {
            const question = questionMap.get(answer.questionId);
            const sessionQuestion = session.questions.find(q => q.questionId === answer.questionId);
            
            return {
                questionId: answer.questionId,
                position: answer.position,
                selectedAnswer: answer.selectedAnswer,
                correctAnswer: question?.correctAnswer || 'Unknown',
                isCorrect: answer.isCorrect,
                timeSpent: answer.timeSpent,
                competencyArea: question?.competencyArea || sessionQuestion?.metadata.competencyArea,
                skillCategory: question?.skillCategory || sessionQuestion?.metadata.skillCategory,
                skillTopic: question?.skillTopic || sessionQuestion?.metadata.skillTopic,
                explanation: question?.explanation || 'No explanation available'
            };
        });
        
        // Calculate competency results
        const competencyResults = new Map();
        questionResults.forEach(result => {
            const competency = result.competencyArea;
            if (!competencyResults.has(competency)) {
                competencyResults.set(competency, {
                    correct: 0,
                    total: 0,
                    percentage: 0,
                    questions: []
                });
            }
            
            const compResult = competencyResults.get(competency);
            compResult.total++;
            if (result.isCorrect) compResult.correct++;
            compResult.percentage = Math.round((compResult.correct / compResult.total) * 100);
            compResult.questions.push(result.position);
        });
        
        // Generate analytics
        const analytics = await this._generateSessionAnalytics(session, questionResults);
        
        return {
            finalScore,
            competencyResults,
            questionResults,
            analytics
        };
    }

    /**
     * Generate analytics for a completed session
     */
    async _generateSessionAnalytics(session, questionResults) {
        // Get user's historical performance for comparison
        const userSessions = await QuizSession.getUserHistory(session.userId, { limit: 10, status: 'completed' });
        
        const analytics = {
            improvementFromAverage: 0,
            achievedDifficulty: session.configuration.difficulty,
            strongAreas: [],
            weakAreas: [],
            questionsForReview: []
        };
        
        // Calculate improvement from average
        if (userSessions.length > 1) {
            const previousScores = userSessions.slice(1).map(s => s.results?.finalScore?.percentage || 0);
            const averagePrevious = previousScores.reduce((sum, score) => sum + score, 0) / previousScores.length;
            analytics.improvementFromAverage = session.results.finalScore.percentage - averagePrevious;
        }
        
        // Identify strong and weak areas
        session.progress.competencyPerformance.forEach((performance, competency) => {
            if (performance.percentage >= 80) {
                analytics.strongAreas.push(competency);
            } else if (performance.percentage < 60) {
                analytics.weakAreas.push(competency);
            }
        });
        
        // Identify questions for review
        analytics.questionsForReview = questionResults
            .filter(result => !result.isCorrect)
            .map(result => result.questionId);
        
        return analytics;
    }

    /**
     * Format session data for user consumption
     */
    _formatSessionForUser(session) {
        return {
            sessionId: session.sessionId,
            configuration: session.configuration,
            currentQuestion: session.currentQuestion,
            progress: {
                currentPosition: session.progress.currentPosition,
                totalQuestions: session.configuration.questionCount,
                completionPercentage: session.completionPercentage,
                currentScore: session.progress.currentScore,
                remainingQuestions: session.remainingQuestions
            },
            timing: {
                startTime: session.timing.startTime,
                totalDuration: session.timing.totalDuration
            },
            status: session.status
        };
    }

    /**
     * Helper methods
     */
    
    _generateQuestionId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex');
        return `q_${timestamp}_${random}`;
    }

    _mapCompetencyKey(competencyArea) {
        const mapping = {
            physicalCareSkills: 'Physical Care Skills',
            psychosocialCareSkills: 'Psychosocial Care Skills',
            roleOfNurseAide: 'Role of the Nurse Aide'
        };
        return mapping[competencyArea] || competencyArea;
    }

    _getSelectionReason(question, userProgressMap, dueQuestions) {
        const userProgress = userProgressMap.get(question.questionId);
        
        if (!userProgress) return 'new_question';
        if (dueQuestions.some(q => q.questionId === question.questionId)) return 'spaced_repetition';
        if (userProgress.stats.accuracy < 70) return 'weak_area_focus';
        return 'random_selection';
    }

    _shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    _assessPoolHealth(stats) {
        let score = 100;
        let status = 'excellent';
        
        if (stats.totalActiveQuestions < this.minQuestionPoolSize) {
            score -= 30;
        }
        
        // Check distribution balance
        const competencyValues = Object.values(stats.competencyDistribution);
        const imbalance = Math.max(...competencyValues.map(c => c.count)) - Math.min(...competencyValues.map(c => c.count));
        if (imbalance > 50) {
            score -= 20;
        }
        
        if (score >= 80) status = 'excellent';
        else if (score >= 60) status = 'good';
        else if (score >= 40) status = 'fair';
        else status = 'poor';
        
        return { score, status };
    }

    /**
     * Start background maintenance tasks
     */
    _startMaintenanceTasks() {
        // Check pool health every 30 minutes
        setInterval(() => {
            this._performPoolMaintenance().catch(error => {
                console.error('❌ Pool maintenance failed:', error);
            });
        }, 30 * 60 * 1000);

        // Clean up old sessions daily
        setInterval(() => {
            QuizSession.cleanupOldSessions().catch(error => {
                console.error('❌ Session cleanup failed:', error);
            });
        }, 24 * 60 * 60 * 1000);

        console.log('🔧 Started Question Pool Service maintenance tasks');
    }

    async _performPoolMaintenance() {
        try {
            const stats = await this.getPoolStats();
            
            // Generate questions for areas that are running low
            for (const recommendation of stats.recommendations) {
                if (recommendation.priority === 'high') {
                    console.log(`🔧 Generating ${recommendation.needed} questions for ${recommendation.area}`);
                    await this.generateQuestions({
                        competencyArea: recommendation.area,
                        count: recommendation.needed
                    });
                }
            }
            
            // Perform question quality maintenance
            await QuestionBank.performMaintenance();
            
        } catch (error) {
            console.error('❌ Pool maintenance error:', error);
        }
    }
}

module.exports = QuestionPoolService;