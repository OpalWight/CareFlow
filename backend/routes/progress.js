const express = require('express');
const router = express.Router();
const UserProgress = require('../models/UserProgress');
const auth = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// Get user's progress summary
router.get('/summary', auth, async (req, res) => {
  try {
    const summary = await UserProgress.getUserProgressSummary(req.user.id);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching progress summary:', error);
    res.status(500).json({ message: 'Server error while fetching progress summary' });
  }
});

// Get progress for a specific skill
router.get('/skill/:skillId', auth, async (req, res) => {
  try {
    const { skillId } = req.params;
    const progress = await UserProgress.findOne({ 
      userId: req.user.id, 
      skillId 
    });

    if (!progress) {
      return res.json({
        skillId,
        patientSimProgress: {
          isCompleted: false,
          completedSteps: [],
          totalSteps: 0,
          score: 0,
          timeSpent: 0,
          attempts: 0,
          bestScore: 0
        },
        chatSimProgress: {
          isCompleted: false,
          sessionsCompleted: 0,
          totalSessions: 1,
          timeSpent: 0,
          chatSessions: []
        },
        overallProgress: {
          isCompleted: false,
          completionPercentage: 0,
          totalTimeSpent: 0
        }
      });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error fetching skill progress:', error);
    res.status(500).json({ message: 'Server error while fetching skill progress' });
  }
});

// Initialize or update patient simulation progress
router.post('/skill/:skillId/patient-sim', [
  auth,
  body('totalSteps').isInt({ min: 1 }).withMessage('Total steps must be a positive integer'),
  body('completedSteps').isArray().withMessage('Completed steps must be an array'),
  body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skillId } = req.params;
    const { totalSteps, completedSteps, score, timeSpent } = req.body;

    console.log('Patient simulation progress update request:', {
      userId: req.user.id,
      skillId,
      totalSteps,
      completedStepsCount: completedSteps.length,
      score,
      timeSpent
    });

    // Find existing progress or create new one
    let progress = await UserProgress.findOne({ 
      userId: req.user.id, 
      skillId 
    });

    if (!progress) {
      progress = new UserProgress({
        userId: req.user.id,
        skillId,
        patientSimProgress: {
          totalSteps,
          completedSteps: [],
          score: 0,
          timeSpent: 0,
          attempts: 0,
          bestScore: 0
        }
      });
    } else {
      // Update totalSteps in case the skill structure has changed
      progress.patientSimProgress.totalSteps = totalSteps;
    }

    // Update patient simulation progress
    await progress.updatePatientSimProgress(completedSteps, score, timeSpent);

    console.log('Patient simulation progress updated successfully for user:', req.user.id, 'skill:', skillId);
    res.json(progress);
  } catch (error) {
    console.error('Error updating patient simulation progress:', error);
    res.status(500).json({ message: 'Server error while updating patient simulation progress' });
  }
});

// Update chat simulation progress
router.post('/skill/:skillId/chat-sim', [
  auth,
  body('sessionId').isMongoId().withMessage('Invalid session ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('duration').isInt({ min: 0 }).withMessage('Duration must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Chat progress validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { skillId } = req.params;
    const { sessionId, rating, duration } = req.body;

    console.log('Chat progress update request:', {
      userId: req.user.id,
      skillId,
      sessionId,
      rating,
      duration
    });

    // Find existing progress or create new one
    let progress = await UserProgress.findOne({ 
      userId: req.user.id, 
      skillId 
    });

    if (!progress) {
      progress = new UserProgress({
        userId: req.user.id,
        skillId,
        patientSimProgress: {
          totalSteps: 0 // Will be set when patient sim is started
        }
      });
    }

    // Update chat simulation progress
    await progress.updateChatSimProgress(sessionId, rating, duration);

    console.log('Chat progress updated successfully for user:', req.user.id, 'skill:', skillId);
    res.json(progress);
  } catch (error) {
    console.error('Error updating chat simulation progress:', error);
    console.error('Error details:', {
      userId: req.user?.id,
      skillId: req.params?.skillId,
      requestBody: req.body,
      stack: error.stack
    });
    res.status(500).json({ message: 'Server error while updating chat simulation progress' });
  }
});

// Initialize progress for a skill (when user first starts)
router.post('/skill/:skillId/initialize', [
  auth,
  body('totalSteps').isInt({ min: 1 }).withMessage('Total steps must be a positive integer'),
  body('totalChatSessions').optional().isInt({ min: 1 }).withMessage('Total chat sessions must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skillId } = req.params;
    const { totalSteps, totalChatSessions = 1 } = req.body;

    // Check if progress already exists
    const existingProgress = await UserProgress.findOne({ 
      userId: req.user.id, 
      skillId 
    });

    if (existingProgress) {
      return res.json(existingProgress);
    }

    // Create new progress record
    const progress = new UserProgress({
      userId: req.user.id,
      skillId,
      patientSimProgress: {
        totalSteps,
        completedSteps: [],
        score: 0,
        timeSpent: 0,
        attempts: 0,
        bestScore: 0
      },
      chatSimProgress: {
        totalSessions: totalChatSessions,
        sessionsCompleted: 0,
        timeSpent: 0,
        chatSessions: []
      }
    });

    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error('Error initializing skill progress:', error);
    res.status(500).json({ message: 'Server error while initializing skill progress' });
  }
});

// Reset progress for a specific skill
router.delete('/skill/:skillId/reset', auth, async (req, res) => {
  try {
    const { skillId } = req.params;
    
    const result = await UserProgress.findOneAndDelete({ 
      userId: req.user.id, 
      skillId 
    });

    if (!result) {
      return res.status(404).json({ message: 'No progress found for this skill' });
    }

    res.json({ message: 'Progress reset successfully' });
  } catch (error) {
    console.error('Error resetting skill progress:', error);
    res.status(500).json({ message: 'Server error while resetting skill progress' });
  }
});

// Get leaderboard data (top performers for a skill)
router.get('/leaderboard/:skillId', auth, async (req, res) => {
  try {
    const { skillId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await UserProgress.find({ 
      skillId,
      'overallProgress.isCompleted': true
    })
    .populate('userId', 'name')
    .sort({ 
      'patientSimProgress.bestScore': -1,
      'overallProgress.totalTimeSpent': 1 
    })
    .limit(limit)
    .select('userId patientSimProgress.bestScore overallProgress.totalTimeSpent overallProgress.lastUpdatedAt');

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error while fetching leaderboard' });
  }
});

// Get aggregate statistics for all users (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    // This should check for admin role in production
    const stats = await UserProgress.aggregate([
      {
        $group: {
          _id: '$skillId',
          totalUsers: { $sum: 1 },
          completedUsers: {
            $sum: { $cond: ['$overallProgress.isCompleted', 1, 0] }
          },
          averageScore: { $avg: '$patientSimProgress.bestScore' },
          averageTimeSpent: { $avg: '$overallProgress.totalTimeSpent' },
          averageChatRating: { $avg: '$chatSimProgress.averageRating' }
        }
      },
      {
        $project: {
          skillId: '$_id',
          totalUsers: 1,
          completedUsers: 1,
          completionRate: { 
            $multiply: [
              { $divide: ['$completedUsers', '$totalUsers'] }, 
              100
            ]
          },
          averageScore: { $round: ['$averageScore', 1] },
          averageTimeSpent: { $round: ['$averageTimeSpent', 0] },
          averageChatRating: { $round: ['$averageChatRating', 1] }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

module.exports = router;