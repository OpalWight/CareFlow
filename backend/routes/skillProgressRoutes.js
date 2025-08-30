const express = require('express');
const router = express.Router();
const skillProgressController = require('../controllers/skillProgressController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/skill-progress/test
 * Simple test endpoint
 */
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Skill progress API working',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /api/skill-progress/dashboard
 * Get user's skill progress dashboard overview
 */
router.get('/dashboard', skillProgressController.getSkillDashboard);

/**
 * GET /api/skill-progress/analysis
 * Get comprehensive skill analysis for the authenticated user
 */
router.get('/analysis', skillProgressController.getSkillAnalysis);

/**
 * GET /api/skill-progress/needs-practice
 * Get skills that need practice for adaptive learning
 * Query params: limit (default: 5)
 */
router.get('/needs-practice', skillProgressController.getSkillsNeedingPractice);

/**
 * GET /api/skill-progress/strongest
 * Get user's strongest skills
 * Query params: limit (default: 5)
 */
router.get('/strongest', skillProgressController.getStrongestSkills);

/**
 * GET /api/skill-progress/recommendations
 * Get personalized learning recommendations
 */
router.get('/recommendations', skillProgressController.getRecommendations);

/**
 * GET /api/skill-progress/trends
 * Get skill progress trends over time
 * Query params: days (default: 30)
 */
router.get('/trends', skillProgressController.getProgressTrends);

/**
 * GET /api/skill-progress/competency-breakdown
 * Get breakdown by competency areas (Physical Care, Psychosocial, Role of Nurse Aide)
 */
router.get('/competency-breakdown', skillProgressController.getCompetencyBreakdown);

/**
 * GET /api/skill-progress/skill/:skillTopic
 * Get detailed information for a specific skill
 */
router.get('/skill/:skillTopic', skillProgressController.getSkillDetails);

console.log('✅ All skill progress routes registered successfully');

module.exports = router;