// Updated Quiz Controller - Individual Question System
const QuestionPoolService = require('../services/QuestionPoolService');
const UserQuizPreferences = require('../models/UserQuizPreferences');
const UserSkillProgress = require('../models/UserSkillProgress');
const QuizSession = require('../models/QuizSession');
const QuestionBank = require('../models/QuestionBank');
const UserQuestionProgress = require('../models/UserQuestionProgress');

// Initialize services
let questionPoolService = null;

const initializeServices = async () => {
    if (!questionPoolService) {
        questionPoolService = new QuestionPoolService();
        try {
            await questionPoolService.initialize();
            console.log('✅ Question Pool Service ready');
        } catch (error) {
            console.warn('⚠️ Question Pool Service initialization failed:', error.message);
        }
    }
    
    return { questionPoolService };
};

/**
 * Generate quiz questions using the new individual question system
 */
exports.generateQuizQuestions = async (req, res) => {
    try {
        const userId = req.user.id;
        const customPreferences = req.body; // Optional custom preferences for this quiz
        
        console.log(`🎯 Generating quiz for user ${userId}`);
        
        // Initialize services
        const services = await initializeServices();
        
        if (!services.questionPoolService) {
            return res.status(500).json({
                message: 'Question Pool Service not available',
                error: 'SERVICE_UNAVAILABLE'
            });
        }
        
        // Create quiz session with selected questions
        const quizSession = await services.questionPoolService.createQuizSession(
            userId, 
            customPreferences
        );
        
        // Get the first question to start the quiz
        const firstQuestion = await _getQuestionForUser(quizSession.sessionId, 0);
        
        // Store quiz session info for later validation
        req.session = req.session || {};
        req.session.currentQuiz = {
            sessionId: quizSession.sessionId,
            startTime: new Date()
        };
        
        res.json({
            sessionId: quizSession.sessionId,
            totalQuestions: quizSession.configuration.questionCount,
            currentQuestion: firstQuestion,
            progress: quizSession.progress,
            gradingMode: quizSession.configuration.gradingMode,
            configuration: {
                competencyDistribution: quizSession.configuration.competencyDistribution,
                difficulty: quizSession.configuration.difficulty,
                quizType: quizSession.configuration.quizType,
                gradingMode: quizSession.configuration.gradingMode
            },
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error generating quiz:', error);
        res.status(500).json({
            message: 'Error generating quiz',
            error: 'QUIZ_GENERATION_FAILED',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get next question in quiz session
 */
exports.getNextQuestion = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { position } = req.query;
        const userId = req.user.id;
        
        console.log(`📝 Getting question ${position} for session ${sessionId}`);
        
        // Verify session belongs to user
        const session = await QuizSession.findOne({ sessionId, userId });
        if (!session) {
            return res.status(404).json({
                message: 'Quiz session not found',
                error: 'SESSION_NOT_FOUND'
            });
        }
        
        if (session.status !== 'active') {
            return res.status(400).json({
                message: 'Quiz session is not active',
                error: 'SESSION_INACTIVE',
                status: session.status
            });
        }
        
        // Get question for user (without correct answer)
        const question = await _getQuestionForUser(sessionId, parseInt(position) || session.progress.currentPosition);
        
        if (!question) {
            return res.status(404).json({
                message: 'Question not found',
                error: 'QUESTION_NOT_FOUND'
            });
        }
        
        res.json({
            question,
            progress: {
                currentPosition: session.progress.currentPosition,
                totalQuestions: session.configuration.questionCount,
                completionPercentage: session.completionPercentage,
                currentScore: session.progress.currentScore
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting next question:', error);
        res.status(500).json({
            message: 'Error retrieving question',
            error: 'QUESTION_RETRIEVAL_FAILED'
        });
    }
};

/**
 * Submit answer for current question
 */
exports.submitAnswer = async (req, res) => {
    try {
        const { sessionId, questionId, selectedAnswer, timeSpent = 0 } = req.body;
        const userId = req.user.id;
        
        console.log(`📝 Submitting answer for question ${questionId} in session ${sessionId}`);
        
        // Validate input
        if (!sessionId || !questionId || !selectedAnswer) {
            return res.status(400).json({
                message: 'Missing required fields',
                error: 'MISSING_FIELDS'
            });
        }
        
        if (!['A', 'B', 'C', 'D'].includes(selectedAnswer)) {
            return res.status(400).json({
                message: 'Invalid answer selection',
                error: 'INVALID_ANSWER'
            });
        }
        
        // Verify session belongs to user
        const session = await QuizSession.findOne({ sessionId, userId, status: 'active' });
        if (!session) {
            return res.status(404).json({
                message: 'Active quiz session not found',
                error: 'SESSION_NOT_FOUND'
            });
        }
        
        // Initialize services
        const services = await initializeServices();
        
        // Submit answer through question pool service
        const result = await services.questionPoolService.submitAnswer(
            sessionId,
            questionId,
            selectedAnswer,
            timeSpent
        );
        
        // Get updated session info
        const updatedSession = await QuizSession.findOne({ sessionId });
        
        // Check if quiz is complete
        const isComplete = updatedSession.progress.currentPosition >= updatedSession.configuration.questionCount;
        
        if (isComplete) {
            // Complete the session
            const finalResults = await services.questionPoolService.completeQuizSession(sessionId);
            
            // Update skill progress
            await _updateUserSkillProgress(userId, updatedSession);
            
            res.json({
                ...result,
                quizComplete: true,
                finalResults: finalResults.results,
                analytics: finalResults.analytics
            });
        } else {
            // Check grading mode to determine response format
            const gradingMode = updatedSession.configuration.gradingMode || 'immediate';
            
            if (gradingMode === 'immediate') {
                // Immediate mode: include next question for navigation
                console.log(`🔍 DEBUG: Immediate mode - getting next question at position ${updatedSession.progress.currentPosition}`);
                console.log(`🔍 DEBUG: Session progress: ${updatedSession.progress.currentPosition}/${updatedSession.configuration.questionCount}`);
                
                const nextQuestion = await _getQuestionForUser(sessionId, updatedSession.progress.currentPosition);
                
                console.log(`🔍 DEBUG: nextQuestion result: ${nextQuestion ? 'SUCCESS' : 'NULL'}`);
                if (nextQuestion) {
                    console.log(`🔍 DEBUG: nextQuestion details: ${JSON.stringify({questionId: nextQuestion.questionId, position: nextQuestion.position})}`);
                } else {
                    console.error(`🔍 DEBUG: ❌ CRITICAL: nextQuestion is NULL at position ${updatedSession.progress.currentPosition}`);
                }
                
                res.json({
                    ...result,
                    quizComplete: false,
                    nextQuestion,
                    progress: {
                        currentPosition: updatedSession.progress.currentPosition,
                        totalQuestions: updatedSession.configuration.questionCount,
                        completionPercentage: updatedSession.completionPercentage,
                        currentScore: updatedSession.progress.currentScore
                    }
                });
            } else {
                // Complete mode: minimal response without next question
                console.log(`📋 Complete mode: Answer submitted without next question for session ${sessionId}`);
                res.json({
                    ...result,
                    quizComplete: false,
                    progress: {
                        currentPosition: updatedSession.progress.currentPosition,
                        totalQuestions: updatedSession.configuration.questionCount,
                        completionPercentage: updatedSession.completionPercentage
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error submitting answer:', error);
        res.status(500).json({
            message: 'Error processing answer',
            error: 'ANSWER_SUBMISSION_FAILED',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Complete quiz session and get results
 */
exports.completeQuizSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        
        console.log(`🏁 Completing quiz session ${sessionId}`);
        
        // Verify session belongs to user
        const session = await QuizSession.findOne({ sessionId, userId });
        if (!session) {
            return res.status(404).json({
                message: 'Quiz session not found',
                error: 'SESSION_NOT_FOUND'
            });
        }
        
        // Initialize services
        const services = await initializeServices();
        
        // Complete the session
        const results = await services.questionPoolService.completeQuizSession(sessionId);
        
        // Update skill progress
        await _updateUserSkillProgress(userId, session);
        
        // Clear session info
        if (req.session && req.session.currentQuiz && req.session.currentQuiz.sessionId === sessionId) {
            delete req.session.currentQuiz;
        }
        
        res.json(results);
        
    } catch (error) {
        console.error('❌ Error completing quiz session:', error);
        res.status(500).json({
            message: 'Error completing quiz',
            error: 'QUIZ_COMPLETION_FAILED'
        });
    }
};

/**
 * Get user's quiz history (from sessions)
 */
exports.getQuizHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10, page = 1, quizType } = req.query;
        
        const skip = (page - 1) * limit;
        
        // Get quiz sessions
        const sessions = await QuizSession.getUserHistory(userId, {
            limit: parseInt(limit),
            skip,
            quizType,
            status: 'completed'
        });
        
        // Get total count
        const totalCount = await QuizSession.countDocuments({
            userId,
            status: 'completed',
            ...(quizType && { 'configuration.quizType': quizType })
        });
        
        // Get user's overall statistics
        const userStats = await _getUserQuizStats(userId);
        
        res.json({
            sessions: sessions.map(session => ({
                sessionId: session.sessionId,
                score: session.results?.finalScore?.correct || 0,
                totalQuestions: session.configuration.questionCount,
                percentage: session.results?.finalScore?.percentage || 0,
                date: session.createdAt,
                duration: session.timing.totalDuration,
                quizType: session.configuration.quizType,
                competencyPerformance: Object.fromEntries(session.results?.competencyResults || new Map())
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
        console.error('❌ Error getting quiz history:', error);
        res.status(500).json({
            message: 'Error retrieving quiz history',
            error: 'HISTORY_RETRIEVAL_FAILED'
        });
    }
};

/**
 * Get detailed results for a specific quiz session
 */
exports.getQuizResults = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        
        const session = await QuizSession.findOne({ sessionId, userId, status: 'completed' });
        if (!session) {
            return res.status(404).json({
                message: 'Completed quiz session not found',
                error: 'SESSION_NOT_FOUND'
            });
        }
        
        // Format detailed results
        const detailedResults = {
            sessionId: session.sessionId,
            summary: {
                score: session.results.finalScore.correct,
                totalQuestions: session.results.finalScore.total,
                percentage: session.results.finalScore.percentage,
                timeStarted: session.timing.startTime,
                timeCompleted: session.timing.endTime,
                duration: session.timing.totalDuration,
                quizType: session.configuration.quizType
            },
            questions: session.results.questionResults.map((result, index) => ({
                questionNumber: index + 1,
                questionId: result.questionId,
                question: result.question || 'Question text not available',
                selectedAnswer: result.selectedAnswer,
                correctAnswer: result.correctAnswer,
                isCorrect: result.isCorrect,
                timeSpent: result.timeSpent,
                competencyArea: result.competencyArea,
                skillCategory: result.skillCategory,
                skillTopic: result.skillTopic,
                explanation: result.explanation
            })),
            competencyPerformance: Object.fromEntries(session.results.competencyResults),
            analytics: session.results.analytics
        };
        
        res.json(detailedResults);
        
    } catch (error) {
        console.error('❌ Error getting quiz results:', error);
        res.status(500).json({
            message: 'Error retrieving quiz results',
            error: 'RESULTS_RETRIEVAL_FAILED'
        });
    }
};

/**
 * Get current active session for user
 */
exports.getCurrentSession = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Initialize services
        const services = await initializeServices();
        
        const session = await services.questionPoolService.getCurrentSession(userId);
        
        if (!session) {
            return res.status(404).json({
                message: 'No active quiz session found',
                error: 'NO_ACTIVE_SESSION'
            });
        }
        
        res.json(session);
        
    } catch (error) {
        console.error('❌ Error getting current session:', error);
        res.status(500).json({
            message: 'Error retrieving current session',
            error: 'SESSION_RETRIEVAL_FAILED'
        });
    }
};

/**
 * Abandon current quiz session
 */
exports.abandonQuizSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        const { reason = 'User abandoned' } = req.body;
        
        const session = await QuizSession.findOne({ sessionId, userId });
        if (!session) {
            return res.status(404).json({
                message: 'Quiz session not found',
                error: 'SESSION_NOT_FOUND'
            });
        }
        
        if (session.status !== 'active') {
            return res.status(400).json({
                message: 'Quiz session is not active',
                error: 'SESSION_NOT_ACTIVE'
            });
        }
        
        await session.abandonSession(reason);
        
        // Clear session info
        if (req.session && req.session.currentQuiz && req.session.currentQuiz.sessionId === sessionId) {
            delete req.session.currentQuiz;
        }
        
        res.json({
            message: 'Quiz session abandoned',
            sessionId,
            status: 'abandoned'
        });
        
    } catch (error) {
        console.error('❌ Error abandoning quiz session:', error);
        res.status(500).json({
            message: 'Error abandoning quiz session',
            error: 'SESSION_ABANDON_FAILED'
        });
    }
};

// Helper Functions

/**
 * Get question for user (without correct answer)
 */
async function _getQuestionForUser(sessionId, position) {
    try {
        const session = await QuizSession.findOne({ sessionId });
        if (!session) {
            console.error(`🔍 DEBUG: Session not found for sessionId: ${sessionId}`);
            return null;
        }
        
        console.log(`🔍 DEBUG: _getQuestionForUser called - sessionId: ${sessionId}, position: ${position}`);
        console.log(`🔍 DEBUG: Session has ${session.questions.length} questions, expected: ${session.configuration.questionCount}`);
        console.log(`🔍 DEBUG: Looking for question with position: ${position + 1}`);
        console.log(`🔍 DEBUG: Available positions: [${session.questions.map(q => q.position).join(', ')}]`);
        
        const sessionQuestion = session.questions.find(q => q.position === position + 1);
        if (!sessionQuestion) {
            console.error(`🔍 DEBUG: ❌ Question not found at position ${position + 1}`);
            console.error(`🔍 DEBUG: Available questions positions: ${JSON.stringify(session.questions.map(q => ({id: q.questionId, pos: q.position})))}`);
            return null;
        }
        
        const question = await QuestionBank.findOne({ questionId: sessionQuestion.questionId });
        if (!question) return null;
        
        return {
            questionId: question.questionId,
            position: position + 1,
            question: question.question,
            options: question.options,
            competencyArea: question.competencyArea,
            skillCategory: question.skillCategory,
            skillTopic: question.skillTopic,
            testSubject: question.testSubject,
            difficulty: question.difficulty
            // Note: correctAnswer and explanation are NOT included for active quiz
        };
    } catch (error) {
        console.error('Error getting question for user:', error);
        return null;
    }
}

/**
 * Update user skill progress based on quiz session results
 */
async function _updateUserSkillProgress(userId, session) {
    try {
        if (!session.results || !session.results.questionResults) return;
        
        // Group questions by skill topic
        const skillPerformance = {};
        
        session.results.questionResults.forEach(result => {
            const skillTopic = result.skillTopic || result.competencyArea;
            
            if (!skillPerformance[skillTopic]) {
                skillPerformance[skillTopic] = {
                    competencyArea: result.competencyArea,
                    questionsAnswered: 0,
                    correctAnswers: 0,
                    totalTime: 0
                };
            }
            
            skillPerformance[skillTopic].questionsAnswered++;
            if (result.isCorrect) {
                skillPerformance[skillTopic].correctAnswers++;
            }
            skillPerformance[skillTopic].totalTime += result.timeSpent || 0;
        });
        
        // Update UserSkillProgress for each skill
        for (const [skillTopic, performance] of Object.entries(skillPerformance)) {
            const skillProgress = await UserSkillProgress.findOrCreateSkill(
                userId,
                skillTopic,
                performance.competencyArea
            );
            
            await skillProgress.updateWithQuizData({
                quizId: session.sessionId,
                questionsAnswered: performance.questionsAnswered,
                correctAnswers: performance.correctAnswers,
                timeSpent: performance.totalTime,
                averageDifficulty: session.configuration.difficulty
            });
        }
        
        console.log(`✅ Updated skill progress for user ${userId} based on session ${session.sessionId}`);
        
    } catch (error) {
        console.error('❌ Error updating skill progress:', error);
        // Don't throw error - skill progress update shouldn't fail the quiz
    }
}

/**
 * Get user's overall quiz statistics
 */
async function _getUserQuizStats(userId) {
    try {
        const completedSessions = await QuizSession.find({
            userId,
            status: 'completed'
        }).sort({ createdAt: -1 });
        
        if (completedSessions.length === 0) {
            return {
                totalQuizzes: 0,
                averageScore: 0,
                bestScore: 0,
                improvementTrend: 'No data'
            };
        }
        
        const scores = completedSessions.map(s => s.results?.finalScore?.percentage || 0);
        const totalQuizzes = completedSessions.length;
        const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / totalQuizzes);
        const bestScore = Math.max(...scores);
        
        // Calculate improvement trend
        let improvementTrend = 'Stable';
        if (scores.length >= 5) {
            const recentAvg = scores.slice(0, 3).reduce((sum, score) => sum + score, 0) / 3;
            const olderAvg = scores.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
            
            if (recentAvg > olderAvg + 5) improvementTrend = 'Improving';
            else if (recentAvg < olderAvg - 5) improvementTrend = 'Declining';
        }
        
        return {
            totalQuizzes,
            averageScore,
            bestScore,
            improvementTrend
        };
        
    } catch (error) {
        console.error('Error getting user quiz stats:', error);
        return {
            totalQuizzes: 0,
            averageScore: 0,
            bestScore: 0,
            improvementTrend: 'No data'
        };
    }
}

/**
 * Get all questions for a quiz session (for complete-then-grade mode)
 */
exports.getAllQuestions = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        
        console.log(`📝 Getting all questions for session ${sessionId}`);
        
        // Verify session belongs to user
        const session = await QuizSession.findOne({ sessionId, userId });
        if (!session) {
            return res.status(404).json({
                message: 'Quiz session not found',
                error: 'SESSION_NOT_FOUND'
            });
        }
        
        if (session.status !== 'active') {
            return res.status(400).json({
                message: 'Quiz session is not active',
                error: 'SESSION_INACTIVE',
                status: session.status
            });
        }
        
        // Get all questions for the session
        const questions = [];
        for (let i = 0; i < session.questions.length; i++) {
            const question = await _getQuestionForUser(sessionId, i);
            if (question) {
                questions.push(question);
            }
        }
        
        res.json({
            sessionId,
            questions,
            totalQuestions: session.configuration.questionCount,
            configuration: {
                gradingMode: session.configuration.gradingMode,
                competencyDistribution: session.configuration.competencyDistribution,
                difficulty: session.configuration.difficulty,
                quizType: session.configuration.quizType
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting all questions:', error);
        res.status(500).json({
            message: 'Error getting questions',
            error: 'QUESTIONS_FETCH_FAILED',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Submit all answers for batch grading (complete-then-grade mode)
 */
exports.submitAllAnswers = async (req, res) => {
    try {
        const { sessionId, answers } = req.body;
        const userId = req.user.id;
        
        console.log(`📋 Submitting all answers for session ${sessionId}`);
        
        // Verify session belongs to user
        const session = await QuizSession.findOne({ sessionId, userId });
        if (!session) {
            return res.status(404).json({
                message: 'Quiz session not found',
                error: 'SESSION_NOT_FOUND'
            });
        }
        
        if (session.status !== 'active') {
            return res.status(400).json({
                message: 'Quiz session is not active',
                error: 'SESSION_INACTIVE',
                status: session.status
            });
        }
        
        // Validate answers format
        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                message: 'Invalid answers format',
                error: 'INVALID_ANSWERS'
            });
        }
        
        // Initialize services
        const services = await initializeServices();
        
        // Grade all answers at once
        const results = [];
        let correctCount = 0;
        
        for (const answer of answers) {
            const { questionId, selectedAnswer, timeSpent = 0, position } = answer;
            
            // Get the correct answer from QuestionBank
            const questionData = await QuestionBank.findOne({ questionId });
            if (!questionData) {
                throw new Error(`Question ${questionId} not found`);
            }
            
            const isCorrect = questionData.correctAnswer === selectedAnswer;
            if (isCorrect) correctCount++;
            
            // Store individual result
            const result = {
                questionId,
                position: position || results.length + 1,
                question: questionData.question,
                options: questionData.options,
                selectedAnswer,
                correctAnswer: questionData.correctAnswer,
                isCorrect,
                explanation: questionData.explanation,
                timeSpent,
                competencyArea: questionData.competencyArea,
                skillCategory: questionData.skillCategory,
                skillTopic: questionData.skillTopic,
                testSubject: questionData.testSubject
            };
            
            results.push(result);
            
            // Add to answered questions
            session.progress.answeredQuestions.push({
                questionId,
                position: result.position,
                selectedAnswer,
                isCorrect,
                timeSpent,
                answeredAt: new Date()
            });
            
            // Update user question progress if services available
            if (services.questionPoolService) {
                try {
                    await services.questionPoolService.updateUserQuestionProgress(
                        userId,
                        questionId,
                        isCorrect,
                        timeSpent
                    );
                } catch (progressError) {
                    console.warn('Failed to update question progress:', progressError.message);
                }
            }
        }
        
        // Update session results
        const finalScore = {
            correct: correctCount,
            total: answers.length,
            percentage: Math.round((correctCount / answers.length) * 100)
        };
        
        session.results = {
            finalScore,
            questionResults: results,
            gradedAt: new Date()
        };
        
        session.progress.currentScore = finalScore;
        session.status = 'completed';
        session.timing.endTime = new Date();
        
        // Calculate total duration
        if (session.timing.startTime) {
            session.timing.totalDuration = Math.round((session.timing.endTime - session.timing.startTime) / 1000);
        }
        
        await session.save();
        
        // Update user skill progress
        await _updateUserSkillProgress(userId, session);
        
        res.json({
            sessionId,
            results,
            finalScore,
            gradedAt: new Date(),
            message: 'Quiz completed and graded successfully'
        });
        
    } catch (error) {
        console.error('❌ Error submitting all answers:', error);
        res.status(500).json({
            message: 'Error grading quiz',
            error: 'QUIZ_GRADING_FAILED',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    generateQuizQuestions: exports.generateQuizQuestions,
    getNextQuestion: exports.getNextQuestion,
    submitAnswer: exports.submitAnswer,
    completeQuizSession: exports.completeQuizSession,
    getQuizHistory: exports.getQuizHistory,
    getQuizResults: exports.getQuizResults,
    getCurrentSession: exports.getCurrentSession,
    abandonQuizSession: exports.abandonQuizSession,
    getAllQuestions: exports.getAllQuestions,
    submitAllAnswers: exports.submitAllAnswers
};