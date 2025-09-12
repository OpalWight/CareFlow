const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const quizPreferencesController = require('../controllers/quizPreferencesController');
const auth = require('../middleware/authMiddleware.js');

// Quiz session management
router.post('/generate', auth, quizController.generateQuizQuestions);
router.get('/session/current', auth, quizController.getCurrentSession);
router.get('/session/:sessionId/question', auth, quizController.getNextQuestion);
router.post('/session/answer', auth, quizController.submitAnswer);
router.post('/session/:sessionId/complete', auth, quizController.completeQuizSession);
router.post('/session/:sessionId/abandon', auth, quizController.abandonQuizSession);

// Quiz history and results
router.get('/history', auth, quizController.getQuizHistory);
router.get('/results/:sessionId', auth, quizController.getQuizResults);

// Quiz customization and preferences
router.get('/preferences', auth, quizPreferencesController.getUserPreferences);
router.put('/preferences', auth, quizPreferencesController.updateUserPreferences);
router.post('/preferences/reset', auth, quizPreferencesController.resetUserPreferences);

// Quiz templates
router.get('/templates', auth, quizPreferencesController.getQuizTemplates);
router.post('/templates', auth, quizPreferencesController.saveQuizTemplate);
router.post('/templates/:templateName/use', auth, quizPreferencesController.useQuizTemplate);
router.delete('/templates/:templateName', auth, quizPreferencesController.deleteQuizTemplate);

// Customization options and quick custom quizzes
router.get('/customization/options', auth, quizPreferencesController.getCustomizationOptions);
router.post('/custom', auth, quizPreferencesController.generateCustomQuiz);

// Legacy compatibility (deprecated but maintained for existing frontend)
router.post('/submit', auth, quizController.submitAnswer); // Redirected to new answer submission
router.get('/:sessionId', auth, quizController.getQuizResults); // Redirected to new results endpoint

module.exports = router;