const { GoogleGenerativeAI } = require('@google/generative-ai');
const QuizResult = require('../models/QuizResult');
const QuizRAGService = require('../services/quizRagService');
const QuizPoolService = require('../services/quizPoolService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize services
let quizRAGService = null;
let quizPoolService = null;

const initializeServices = async () => {
  if (!quizRAGService) {
    quizRAGService = new QuizRAGService();
    try {
      await quizRAGService.initialize();
      console.log('✅ Quiz RAG Service ready');
    } catch (error) {
      console.warn('⚠️ Quiz RAG Service initialization failed:', error.message);
    }
  }
  
  if (!quizPoolService) {
    quizPoolService = new QuizPoolService();
    try {
      await quizPoolService.initialize();
      console.log('✅ Quiz Pool Service ready');
    } catch (error) {
      console.warn('⚠️ Quiz Pool Service initialization failed:', error.message);
    }
  }
  
  return { quizRAGService, quizPoolService };
};

// CNA competency areas organized by exam distribution
const CNA_DOMAINS = {
    "Physical Care Skills": {
        percentage: 64,
        topics: [
            "Hygiene and Personal Care",
            "Nutrition and Feeding",
            "Infection Control and Standard Precautions", 
            "Safety and Emergency Procedures",
            "Basic Nursing Skills",
            "Mobility and Positioning",
            "Vital Signs and Measurements",
            "Basic Restorative Services"
        ]
    },
    "Psychosocial Care Skills": {
        percentage: 10,
        topics: [
            "Emotional Support and Mental Health",
            "Spiritual Care Needs",
            "Cultural Sensitivity and Diversity",
            "Care of Cognitively Impaired Residents",
            "End-of-Life Care"
        ]
    },
    "Role of the Nurse Aide": {
        percentage: 26,
        topics: [
            "Communication and Interpersonal Skills",
            "Resident Rights and Ethics",
            "Teamwork and Professional Boundaries",
            "Legal and Regulatory Requirements",
            "Documentation and Reporting",
            "Workplace Safety and Professionalism"
        ]
    }
};

// Helper function to generate RAG-enhanced questions
async function generateRAGEnhancedQuestions(model, domainContent, ragService) {
    const allQuestions = [];
    
    try {
        // Generate questions for each domain
        for (const [domainKey, domainInfo] of Object.entries(domainContent)) {
            console.log(`🎯 Generating ${domainInfo.questionCount} questions for ${domainInfo.domain}...`);
            
            if (domainInfo.content && domainInfo.content.length > 0) {
                const contentSummary = ragService.formatContentForPrompt(domainInfo.content);
                const domainQuestions = await generateDomainQuestions(
                    model,
                    domainInfo.domain,
                    domainInfo.questionCount,
                    contentSummary
                );
                
                allQuestions.push(...domainQuestions);
                console.log(`✅ Generated ${domainQuestions.length} questions for ${domainInfo.domain}`);
            } else {
                console.log(`⚠️ No content found for ${domainInfo.domain}, skipping`);
            }
        }
    } catch (error) {
        console.error('❌ Error in RAG-enhanced question generation:', error);
    }
    
    return allQuestions;
}

// Helper function to generate questions for a specific domain using RAG content
async function generateDomainQuestions(model, domain, questionCount, contentSummary) {
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
    "explanation": "Brief explanation referencing the training content"
  }
]

Generate exactly ${questionCount} questions. Return ONLY the JSON array, no other text.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let generatedText = response.text();
        
        // Clean up and parse JSON
        generatedText = generatedText.trim();
        
        // Remove markdown code blocks if present
        if (generatedText.startsWith('```json')) {
            generatedText = generatedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (generatedText.startsWith('```')) {
            generatedText = generatedText.replace(/```\n?/, '').replace(/\n?```$/, '');
        }
        
        const questions = JSON.parse(generatedText);
        
        if (Array.isArray(questions)) {
            return questions.slice(0, questionCount);
        } else {
            console.error('❌ Invalid response format for domain questions');
            return [];
        }
    } catch (error) {
        console.error(`❌ Error generating questions for ${domain}:`, error);
        return [];
    }
}



async function generateFallbackAIQuestions(model, questionCount, physicalCareCount, psychosocialCount, nurseAideRoleCount) {
    const prompt = `Generate exactly ${questionCount} CNA (Certified Nursing Assistant) certification exam questions following the official exam distribution.

REQUIRED DISTRIBUTION (MUST BE FOLLOWED EXACTLY):
- Physical Care Skills: ${physicalCareCount} questions (64% - ${CNA_DOMAINS["Physical Care Skills"].topics.join(', ')})
- Psychosocial Care Skills: ${psychosocialCount} questions (10% - ${CNA_DOMAINS["Psychosocial Care Skills"].topics.join(', ')})
- Role of the Nurse Aide: ${nurseAideRoleCount} questions (26% - ${CNA_DOMAINS["Role of the Nurse Aide"].topics.join(', ')})

REQUIREMENTS:
- Each question must be multiple choice with exactly 4 options (A, B, C, D)
- Questions should reflect real CNA certification exam difficulty
- STRICTLY follow the distribution above - do not deviate from the specified counts
- Include both knowledge-based and application-based questions
- Questions must be realistic scenarios CNAs encounter
- One correct answer per question
- Incorrect options should be plausible but clearly wrong to knowledgeable CNAs

STRICT JSON FORMAT - Return ONLY valid JSON array:
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
    "competencyArea": "Physical Care Skills",
    "explanation": "Brief explanation of why this is correct"
  }
]

Generate exactly ${questionCount} questions. Return ONLY the JSON array, no other text.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let generatedText = response.text();
        
        // Clean up the response to extract JSON
        generatedText = generatedText.trim();
        
        // Remove markdown code blocks if present
        if (generatedText.startsWith('```json')) {
            generatedText = generatedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (generatedText.startsWith('```')) {
            generatedText = generatedText.replace(/```\n?/, '').replace(/\n?```$/, '');
        }
        
        let questions;
        try {
            questions = JSON.parse(generatedText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error in fallback generation:', parseError);
            // Try to fix common JSON issues
            let fixedText = generatedText
                .replace(/([^,\]}])\s*\n\s*([{\[])/g, '$1,$2')
                .replace(/,\s*\]/g, ']')
                .replace(/,\s*\}/g, '}');
            
            try {
                questions = JSON.parse(fixedText);
            } catch (secondParseError) {
                console.error('❌ Failed to fix JSON in fallback. Using hardcoded fallback questions...');
                return [];
            }
        }
        
        if (Array.isArray(questions)) {
            return questions.slice(0, questionCount);
        } else {
            console.error('❌ Invalid questions array from fallback AI generation');
            return [];
        }
    } catch (error) {
        console.error('❌ Error in fallback AI generation:', error);
        return [];
    }
}
exports.generateFallbackAIQuestions = generateFallbackAIQuestions;



// Generate CNA quiz questions using quiz pool system
exports.generateQuizQuestions = async (req, res) => {
    try {
        const { questionCount = 30, difficulty = 'intermediate' } = req.body;
        const userId = req.user.id;
        
        console.log(`🎯 Getting quiz for user ${userId} (${questionCount} questions, ${difficulty} difficulty)`);
        
        // Initialize services
        const services = await initializeServices();
        
        let quiz = null;
        let fromPool = false;
        
        // Try to get quiz from pool first
        if (services.quizPoolService) {
            try {
                quiz = await services.quizPoolService.getQuizForUser(userId, { difficulty, questionCount });
                console.log(`[DEBUG] Quiz fetched from pool: ${quiz ? quiz.quizId : 'null'}`);
                if (quiz) {
                    fromPool = true;
                    console.log(`✅ Retrieved quiz ${quiz.quizId} from pool`);
                }
            } catch (error) {
                console.warn('⚠️ Error getting quiz from pool:', error.message);
            }
        }
        
        // If no quiz from pool, generate new one
        if (!quiz) {
            console.log('🔄 No available quiz in pool, generating new quiz...');
            
            if (services.quizPoolService) {
                try {
                    quiz = await services.quizPoolService.generateAndAddQuiz({ 
                        questionCount, 
                        difficulty 
                    });
                    fromPool = false;
                    console.log(`[DEBUG] Generated new quiz with ID: ${quiz.quizId}`);
                    console.log(`✅ Generated new quiz ${quiz.quizId} and added to pool`);
                } catch (error) {
                    console.warn('⚠️ Error generating quiz for pool:', error.message);
                }
            }
        }
        
        // Return quiz questions (without answers for active quiz)
        const response = {
            quizId: quiz.quizId,
            questions: quiz.questions.map(q => ({
                question: q.question,
                options: q.options,
                competencyArea: q.competencyArea,
                skillTopic: q.skillTopic,
                difficulty: q.difficulty
            })),
            totalQuestions: quiz.questions.length,
            generatedAt: new Date().toISOString(),
            fromPool,
            metadata: quiz.metadata || {}
        };
        
        // Store quiz session info for later submission validation
        req.session = req.session || {};
        req.session.currentQuiz = {
            quizId: quiz.quizId,
            fullQuestions: quiz._fullQuestions || quiz.questions,
            startTime: new Date()
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ Error in quiz generation:', error);
        
        // Return fallback questions on error
        try {
            const fallbackQuestions = await generateFallbackAIQuestions(req.body.questionCount || 30);
            const fallbackQuizId = 'fallback_' + Date.now();
            
            res.status(200).json({
                quizId: fallbackQuizId,
                questions: fallbackQuestions.map(q => ({
                    question: q.question,
                    options: q.options,
                    competencyArea: q.competencyArea
                })),
                totalQuestions: fallbackQuestions.length,
                generatedAt: new Date().toISOString(),
                fromPool: false,
                fallback: true
            });
            
            // Store for validation
            req.session = req.session || {};
            req.session.currentQuiz = {
                quizId: fallbackQuizId,
                fullQuestions: fallbackQuestions,
                startTime: new Date()
            };
            
        } catch (fallbackError) {
            console.error('❌ Even fallback generation failed:', fallbackError);
            res.status(500).json({ 
                message: 'Quiz generation temporarily unavailable',
                error: 'GENERATION_FAILED'
            });
        }
    }
};

// Submit quiz results for scoring and feedback
exports.submitQuizResults = async (req, res) => {
    try {
        const { answers, quizId, timeStarted, originalQuizId } = req.body;
        const userId = req.user.id;
        
        console.log(`[DEBUG] Submitting quiz results for quizId: ${quizId}, userId: ${userId}`);

        // Enhanced validation with specific error messages
        if (!answers) {
            return res.status(400).json({ 
                message: 'Missing quiz answers', 
                error: 'MISSING_ANSWERS' 
            });
        }
        
        if (!quizId) {
            return res.status(400).json({ 
                message: 'Missing quiz ID', 
                error: 'MISSING_QUIZ_ID' 
            });
        }
        
        if (!Array.isArray(answers) && typeof answers !== 'object') {
            return res.status(400).json({ 
                message: 'Invalid answers format - must be array or object', 
                error: 'INVALID_ANSWERS_FORMAT' 
            });
        }
        
        // Convert answers to array if it's an object (legacy support)
        const answersArray = Array.isArray(answers) ? answers : Object.values(answers);
        
        // Get quiz questions from session or database with enhanced error handling
        let questions = null;
        const sessionQuiz = req.session?.currentQuiz;
        
        console.log(`[DEBUG] Session quiz check: ${sessionQuiz ? 'found' : 'not found'}`);
        console.log(`[DEBUG] Session quizId: ${sessionQuiz?.quizId}, Submitted quizId: ${quizId}`);
        
        if (sessionQuiz && sessionQuiz.quizId === quizId) {
            questions = sessionQuiz.fullQuestions;
            console.log(`[DEBUG] Retrieved questions from session: ${questions?.length || 0} questions`);
        } else {
            // Try to get questions from quiz pool
            console.log(`[DEBUG] Attempting to retrieve quiz from pool...`);
            const services = await initializeServices();
            if (services.quizPoolService) {
                try {
                    const QuizPool = require('../models/QuizPool');
                    const quizFromPool = await QuizPool.findOne({ quizId });
                    if (quizFromPool) {
                        questions = quizFromPool.questions;
                        console.log(`[DEBUG] Retrieved questions from pool: ${questions?.length || 0} questions`);
                    } else {
                        console.log(`[DEBUG] Quiz not found in pool: ${quizId}`);
                    }
                } catch (error) {
                    console.warn('⚠️ Could not retrieve quiz from pool:', error);
                }
            }
        }
        
        if (!questions || !Array.isArray(questions)) {
            console.error(`[ERROR] Questions not found or invalid format. QuizId: ${quizId}, Questions: ${questions}`);
            return res.status(400).json({ 
                message: 'Quiz not found, expired, or invalid format', 
                error: 'QUIZ_NOT_FOUND',
                details: {
                    quizId,
                    hasSession: !!sessionQuiz,
                    sessionQuizId: sessionQuiz?.quizId,
                    questionsFound: !!questions,
                    questionsArray: Array.isArray(questions)
                }
            });
        }
        
        // Validate answers count matches questions count
        if (answersArray.length !== questions.length) {
            return res.status(400).json({ 
                message: `Answer count mismatch: expected ${questions.length}, received ${answersArray.length}`, 
                error: 'ANSWER_COUNT_MISMATCH',
                details: {
                    expectedAnswers: questions.length,
                    receivedAnswers: answersArray.length
                }
            });
        }
        
        // Calculate score and detailed results
        let correctCount = 0;
        const processedQuestions = [];
        
        questions.forEach((question, index) => {
            const userAnswer = answersArray[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            if (isCorrect) {
                correctCount++;
            }
            
            processedQuestions.push({
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                userAnswer: userAnswer,
                isCorrect: isCorrect,
                competencyArea: question.competencyArea,
                explanation: question.explanation
            });
        });
        
        const score = correctCount;
        const percentage = Math.round((score / questions.length) * 100);
        const timeCompleted = new Date();
        const startTime = timeStarted ? new Date(timeStarted) : new Date(timeCompleted.getTime() - 30 * 60 * 1000); // Default 30 min if not provided
        const durationMinutes = Math.round((timeCompleted - startTime) / (1000 * 60));
        const attemptedAt = startTime; // Use the actual start time as the attempt time
        
        // Generate competency analysis
        const competencyAnalysis = analyzeCompetencyPerformance(processedQuestions.map((q, index) => ({
            questionIndex: index,
            question: q.question,
            userAnswer: q.userAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect: q.isCorrect,
            competencyArea: q.competencyArea,
            explanation: q.explanation
        })));
        
        // Get user's previous attempts for comparison
        const previousAttempts = await QuizResult.find({ userId }).sort({ createdAt: -1 });
        
        // Create and save quiz result
        const quizResult = new QuizResult({
            userId,
            questions: processedQuestions,
            score,
            totalQuestions: questions.length,
            percentage,
            competencyAnalysis: new Map(Object.entries(competencyAnalysis)),
            timeStarted: startTime,
            timeCompleted,
            durationMinutes,
            isRetake: !!originalQuizId,
            originalQuizId: originalQuizId || null,
            metadata: {
                deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
                browserInfo: req.get('User-Agent'),
                ipAddress: req.ip
            }
        });
        
        await quizResult.save();
        console.log(`✅ Quiz result saved for user ${userId}: ${score}/${questions.length} (${percentage}%)`);
        
        // Update skill progress tracking
        try {
            const services = await initializeServices();
            if (services.quizPoolService) {
                // Mark quiz as used in pool
                await services.quizPoolService.markQuizAsUsed(userId, quizId, {
                    score,
                    percentage,
                    durationMinutes,
                    quizResultId: quizResult._id,
                    attemptedAt
                });
            }
            
            // Update skill progress if SkillProgressService available
            const SkillProgressService = require('../services/skillProgressService');
            if (SkillProgressService) {
                const skillProgressService = new SkillProgressService();
                await skillProgressService.initialize();
                
                // Prepare quiz data for skill progress tracking
                const quizResultData = {
                    questions: processedQuestions.map((q, index) => ({
                        question: q.question,
                        isCorrect: q.isCorrect,
                        competencyArea: q.competencyArea,
                        skillTopic: q.skillTopic || null,
                        difficulty: questions[index].difficulty || 'intermediate'
                    })),
                    quizId: quizResult._id.toString()
                };
                
                // Use timeout to prevent hanging on skill progress updates
                await Promise.race([
                    skillProgressService.updateSkillProgress(userId, quizResultData),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Skill progress update timeout')), 10000))
                ]);
                
                console.log(`✅ Updated skill progress for user ${userId}`);
            }
        } catch (skillUpdateError) {
            console.warn('⚠️ Could not update skill progress:', skillUpdateError.message);
            console.warn('⚠️ Skill progress error stack:', skillUpdateError.stack);
            
            // Don't fail the entire quiz submission if skill progress update fails
            // The quiz result has already been saved successfully
        }
        
        // Generate comparison with previous attempts
        const comparison = quizResult.compareWithPrevious(previousAttempts);
        const competencyInsights = quizResult.getCompetencyInsights();
        
        res.json({
            quizId: quizResult._id,
            score,
            totalQuestions: questions.length,
            percentage,
            detailedResults: processedQuestions.map((q, index) => ({
                questionIndex: index,
                question: q.question,
                userAnswer: q.userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect: q.isCorrect,
                competencyArea: q.competencyArea,
                explanation: q.explanation
            })),
            competencyAnalysis,
            competencyInsights,
            comparison,
            durationMinutes,
            submittedAt: timeCompleted.toISOString(),
            attemptNumber: previousAttempts.length + 1
        });
        
    } catch (error) {
        console.error('❌ Error submitting quiz results:', error);
        console.error(`[ERROR DETAILS] User: ${req.user?.id}, QuizId: ${req.body?.quizId}, Stack: ${error.stack}`);
        
        res.status(500).json({ 
            message: 'Error processing quiz results',
            error: 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && { 
                details: error.message,
                stack: error.stack 
            })
        });
    }
};

// Analyze performance by competency area
function analyzeCompetencyPerformance(results) {
    const competencyStats = {};
    
    results.forEach(result => {
        const competency = result.competencyArea;
        if (!competencyStats[competency]) {
            competencyStats[competency] = {
                total: 0,
                correct: 0,
                percentage: 0
            };
        }
        
        competencyStats[competency].total++;
        if (result.isCorrect) {
            competencyStats[competency].correct++;
        }
    });
    
    // Calculate percentages
    Object.keys(competencyStats).forEach(competency => {
        const stats = competencyStats[competency];
        stats.percentage = Math.round((stats.correct / stats.total) * 100);
    });
    
    return competencyStats;
}



// Get user's quiz history
exports.getQuizHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10, page = 1 } = req.query;
        
        const skip = (page - 1) * limit;
        
        // Get paginated quiz history
        const quizzes = await QuizResult.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('score totalQuestions percentage createdAt durationMinutes isRetake competencyAnalysis');
        
        // Get total count for pagination
        const totalCount = await QuizResult.countDocuments({ userId });
        
        // Get user statistics
        const userStats = await QuizResult.getUserStats(userId);
        
        res.json({
            quizzes: quizzes.map(quiz => ({
                id: quiz._id,
                score: quiz.score,
                totalQuestions: quiz.totalQuestions,
                percentage: quiz.percentage,
                date: quiz.createdAt,
                durationMinutes: quiz.durationMinutes,
                isRetake: quiz.isRetake,
                competencyAnalysis: Object.fromEntries(quiz.competencyAnalysis)
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            },
            userStats
        });
        
    } catch (error) {
        console.error('Error getting quiz history:', error);
        res.status(500).json({ message: 'Error retrieving quiz history' });
    }
};

// Get specific quiz details for review/retake
exports.getQuizDetails = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        
        const quiz = await QuizResult.findOne({ _id: quizId, userId });
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        // Get previous attempts for comparison
        const previousAttempts = await QuizResult.find({ 
            userId, 
            createdAt: { $lt: quiz.createdAt } 
        }).sort({ createdAt: -1 });
        
        const comparison = quiz.compareWithPrevious(previousAttempts);
        const competencyInsights = quiz.getCompetencyInsights();
        
        res.json({
            quiz: {
                id: quiz._id,
                score: quiz.score,
                totalQuestions: quiz.totalQuestions,
                percentage: quiz.percentage,
                questions: quiz.questions,
                timeStarted: quiz.timeStarted,
                timeCompleted: quiz.timeCompleted,
                durationMinutes: quiz.durationMinutes,
                isRetake: quiz.isRetake,
                competencyAnalysis: Object.fromEntries(quiz.competencyAnalysis),
                createdAt: quiz.createdAt
            },
            comparison,
            competencyInsights
        });
        
    } catch (error) {
        console.error('Error getting quiz details:', error);
        res.status(500).json({ message: 'Error retrieving quiz details' });
    }
};

// Retake a previous quiz (with same questions)
exports.retakeQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        
        const originalQuiz = await QuizResult.findOne({ _id: quizId, userId });
        
        if (!originalQuiz) {
            return res.status(404).json({ message: 'Original quiz not found' });
        }
        
        // Return the same questions for retaking
        const questions = originalQuiz.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            competencyArea: q.competencyArea,
            explanation: q.explanation
        }));
        
        res.json({
            questions: questions,
            totalQuestions: questions.length,
            originalQuizId: quizId,
            originalScore: originalQuiz.score,
            originalPercentage: originalQuiz.percentage,
            retakeOf: originalQuiz.createdAt
        });
        
    } catch (error) {
        console.error('Error setting up quiz retake:', error);
        res.status(500).json({ message: 'Error setting up quiz retake' });
    }
};

// Get detailed quiz results for review
exports.getQuizResults = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        
        const quiz = await QuizResult.findOne({ _id: quizId, userId });
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz results not found' });
        }
        
        // Format questions for detailed results view
        const detailedQuestions = quiz.questions.map((question, index) => ({
            questionNumber: index + 1,
            question: question.question,
            options: question.options,
            userAnswer: question.userAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect: question.isCorrect,
            competencyArea: question.competencyArea,
            explanation: question.explanation || 'No explanation available for this question.'
        }));
        
        // Calculate competency area performance
        const competencyPerformance = {};
        quiz.questions.forEach(question => {
            const area = question.competencyArea;
            if (!competencyPerformance[area]) {
                competencyPerformance[area] = {
                    total: 0,
                    correct: 0,
                    percentage: 0,
                    questions: []
                };
            }
            competencyPerformance[area].total++;
            if (question.isCorrect) {
                competencyPerformance[area].correct++;
            }
            competencyPerformance[area].questions.push({
                questionNumber: quiz.questions.indexOf(question) + 1,
                isCorrect: question.isCorrect
            });
        });
        
        // Calculate percentages
        Object.keys(competencyPerformance).forEach(area => {
            const performance = competencyPerformance[area];
            performance.percentage = Math.round((performance.correct / performance.total) * 100);
        });
        
        // Get user's quiz statistics for context
        const userStats = await QuizResult.getUserStats(userId);
        
        res.json({
            quizId: quiz._id,
            summary: {
                score: quiz.score,
                totalQuestions: quiz.totalQuestions,
                percentage: quiz.percentage,
                timeStarted: quiz.timeStarted,
                timeCompleted: quiz.timeCompleted,
                durationMinutes: quiz.durationMinutes,
                isRetake: quiz.isRetake,
                completedAt: quiz.createdAt
            },
            questions: detailedQuestions,
            competencyPerformance,
            userStats: {
                totalAttempts: userStats?.totalAttempts || 0,
                averageScore: userStats?.averageScore || 0,
                bestScore: userStats?.bestScore || 0,
                improvementTrend: userStats?.improvementTrend || 'No data'
            },
            filters: {
                totalQuestions: detailedQuestions.length,
                correctAnswers: detailedQuestions.filter(q => q.isCorrect).length,
                incorrectAnswers: detailedQuestions.filter(q => !q.isCorrect).length
            }
        });
        
    } catch (error) {
        console.error('Error getting quiz results:', error);
        res.status(500).json({ message: 'Error retrieving quiz results' });
    }
};