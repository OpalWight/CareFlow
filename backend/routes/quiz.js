const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/authMiddleware.js');

router.post('/generate', auth, quizController.generateQuizQuestions);
router.post('/submit', auth, quizController.submitQuizResults);
router.get('/history', auth, quizController.getQuizHistory);
router.get('/:quizId', auth, quizController.getQuizDetails);
router.post('/:quizId/retake', auth, quizController.retakeQuiz);

module.exports = router;