const mongoose = require('mongoose');

const UserQuizHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,  // One record per user
        index: true
    },
    
    // Quizzes the user has completed
    completedQuizzes: [{
        quizId: {
            type: String,  // References QuizPool.quizId
            required: true
        },
        completedAt: {
            type: Date,
            default: Date.now
        },
        score: Number,
        percentage: Number,
        durationMinutes: Number,
        quizResultId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'QuizResult'
        }
    }],
    
    // Track user's quiz preferences and patterns
    preferences: {
        preferredDifficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'adaptive'],
            default: 'adaptive'
        },
        preferredQuestionCount: {
            type: Number,
            default: 30,
            min: 5,
            max: 50
        },
        // Areas user wants to focus on
        focusAreas: [{
            type: String,
            enum: ['Physical Care Skills', 'Psychosocial Care Skills', 'Role of the Nurse Aide']
        }],
        // Whether to prioritize weak skills
        adaptiveLearning: {
            type: Boolean,
            default: true
        }
    },
    
    // Quiz assignment tracking
    currentAssignment: {
        assignedQuizId: String,
        assignedAt: Date,
        expiresAt: Date,  // Quiz assignment expires after certain time
        isCompleted: {
            type: Boolean,
            default: false
        }
    },
    
    // Performance statistics
    stats: {
        totalQuizzesTaken: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        bestScore: {
            type: Number,
            default: 0
        },
        currentStreak: {
            type: Number,
            default: 0  // Consecutive days with at least one quiz
        },
        longestStreak: {
            type: Number,
            default: 0
        },
        lastQuizDate: Date,
        // Track improvement over time
        performanceTrend: {
            type: String,
            enum: ['improving', 'stable', 'declining', 'insufficient_data'],
            default: 'insufficient_data'
        },
        // Recent performance (last 5 quizzes)
        recentPerformance: [{
            date: Date,
            score: Number,
            percentage: Number
        }]
    },
    
    // Learning milestones and achievements
    achievements: [{
        type: {
            type: String,
            enum: ['first_quiz', 'perfect_score', 'streak_week', 'streak_month', 'skill_mastery', 'improvement_milestone']
        },
        achievedAt: {
            type: Date,
            default: Date.now
        },
        details: String
    }],
    
    // Analytics for quiz selection algorithm
    analytics: {
        // Time patterns - when user typically takes quizzes
        timePatterns: {
            preferredHours: [Number],  // Hours of day (0-23)
            preferredDays: [Number],   // Days of week (0-6, Sunday=0)
            averageSessionLength: Number  // in minutes
        },
        // Difficulty progression tracking
        difficultyProgression: [{
            difficulty: String,
            date: Date,
            averageScore: Number
        }]
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
UserQuizHistorySchema.index({ 'completedQuizzes.quizId': 1 });
UserQuizHistorySchema.index({ 'stats.lastQuizDate': -1 });
UserQuizHistorySchema.index({ 'currentAssignment.assignedQuizId': 1 });

// Virtual for getting completed quiz IDs
UserQuizHistorySchema.virtual('completedQuizIds').get(function() {
    return this.completedQuizzes.map(quiz => quiz.quizId);
});

// Method to check if user has taken a specific quiz
UserQuizHistorySchema.methods.hasTakenQuiz = function(quizId) {
    return this.completedQuizzes.some(quiz => quiz.quizId === quizId);
};

// Method to add completed quiz
UserQuizHistorySchema.methods.addCompletedQuiz = function(quizData) {
    const { quizId, score, percentage, durationMinutes, quizResultId } = quizData;
    
    // Don't add if already exists
    if (this.hasTakenQuiz(quizId)) {
        return this;
    }
    
    // Add to completed quizzes
    this.completedQuizzes.push({
        quizId,
        completedAt: new Date(),
        score,
        percentage,
        durationMinutes,
        quizResultId
    });
    
    // Update statistics
    this.stats.totalQuizzesTaken++;
    
    // Update average score
    const totalScore = this.completedQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0);
    this.stats.averageScore = Math.round(totalScore / this.completedQuizzes.length);
    
    // Update best score
    if (score > this.stats.bestScore) {
        this.stats.bestScore = score;
    }
    
    // Update last quiz date and streak
    const today = new Date();
    const lastQuizDate = this.stats.lastQuizDate;
    
    if (lastQuizDate) {
        const daysDiff = Math.floor((today - lastQuizDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
            // Consecutive day
            this.stats.currentStreak++;
        } else if (daysDiff > 1) {
            // Streak broken
            this.stats.currentStreak = 1;
        }
        // Same day doesn't change streak
    } else {
        // First quiz
        this.stats.currentStreak = 1;
    }
    
    // Update longest streak
    if (this.stats.currentStreak > this.stats.longestStreak) {
        this.stats.longestStreak = this.stats.currentStreak;
    }
    
    this.stats.lastQuizDate = today;
    
    // Update recent performance (keep last 5 quizzes)
    this.stats.recentPerformance.push({
        date: today,
        score,
        percentage
    });
    
    if (this.stats.recentPerformance.length > 5) {
        this.stats.recentPerformance = this.stats.recentPerformance.slice(-5);
    }
    
    // Calculate performance trend
    this._calculatePerformanceTrend();
    
    // Clear current assignment if this was the assigned quiz
    if (this.currentAssignment.assignedQuizId === quizId) {
        this.currentAssignment.isCompleted = true;
    }
    
    // Check for achievements
    this._checkAchievements(score, percentage);
    
    return this.save();
};

// Method to assign a quiz to the user
UserQuizHistorySchema.methods.assignQuiz = function(quizId, expirationHours = 24) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);
    
    this.currentAssignment = {
        assignedQuizId: quizId,
        assignedAt: new Date(),
        expiresAt,
        isCompleted: false
    };
    
    return this.save();
};

// Method to check if current assignment is valid
UserQuizHistorySchema.methods.hasValidAssignment = function() {
    if (!this.currentAssignment.assignedQuizId || this.currentAssignment.isCompleted) {
        return false;
    }
    
    return new Date() < this.currentAssignment.expiresAt;
};

// Private method to calculate performance trend
UserQuizHistorySchema.methods._calculatePerformanceTrend = function() {
    if (this.stats.recentPerformance.length < 3) {
        this.stats.performanceTrend = 'insufficient_data';
        return;
    }
    
    const recent = this.stats.recentPerformance.slice(-3);
    const averageOld = (recent[0].percentage + recent[1].percentage) / 2;
    const averageNew = (recent[1].percentage + recent[2].percentage) / 2;
    
    const improvement = averageNew - averageOld;
    
    if (improvement > 5) {
        this.stats.performanceTrend = 'improving';
    } else if (improvement < -5) {
        this.stats.performanceTrend = 'declining';
    } else {
        this.stats.performanceTrend = 'stable';
    }
};

// Private method to check for achievements
UserQuizHistorySchema.methods._checkAchievements = function(score, percentage) {
    const achievements = [];
    
    // First quiz achievement
    if (this.stats.totalQuizzesTaken === 1) {
        achievements.push({
            type: 'first_quiz',
            details: 'Completed your first CNA practice quiz!'
        });
    }
    
    // Perfect score achievement
    if (percentage === 100) {
        achievements.push({
            type: 'perfect_score',
            details: 'Perfect score! You got 100% on a quiz!'
        });
    }
    
    // Streak achievements
    if (this.stats.currentStreak === 7) {
        achievements.push({
            type: 'streak_week',
            details: 'One week streak! You\'ve taken quizzes for 7 consecutive days!'
        });
    } else if (this.stats.currentStreak === 30) {
        achievements.push({
            type: 'streak_month',
            details: 'One month streak! You\'ve taken quizzes for 30 consecutive days!'
        });
    }
    
    // Improvement milestone
    if (this.stats.recentPerformance.length >= 5) {
        const firstScore = this.stats.recentPerformance[0].percentage;
        const lastScore = this.stats.recentPerformance[this.stats.recentPerformance.length - 1].percentage;
        if (lastScore - firstScore >= 20) {
            achievements.push({
                type: 'improvement_milestone',
                details: 'Major improvement! Your scores have improved by over 20% in recent quizzes!'
            });
        }
    }
    
    // Add new achievements
    achievements.forEach(achievement => {
        // Check if this type of achievement already exists
        const existingAchievement = this.achievements.find(a => a.type === achievement.type);
        if (!existingAchievement) {
            this.achievements.push(achievement);
        }
    });
};

// Static method to find or create user quiz history
UserQuizHistorySchema.statics.findOrCreateForUser = async function(userId) {
    let history = await this.findOne({ userId });
    
    if (!history) {
        history = new this({
            userId,
            completedQuizzes: [],
            preferences: {},
            stats: {},
            achievements: [],
            analytics: {
                timePatterns: {
                    preferredHours: [],
                    preferredDays: [],
                    averageSessionLength: 0
                },
                difficultyProgression: []
            }
        });
        await history.save();
    }
    
    return history;
};

// Static method to get leaderboard data
UserQuizHistorySchema.statics.getLeaderboard = async function(limit = 10, timeframe = 'all') {
    let matchStage = {};
    
    if (timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchStage['stats.lastQuizDate'] = { $gte: weekAgo };
    } else if (timeframe === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchStage['stats.lastQuizDate'] = { $gte: monthAgo };
    }
    
    return this.find(matchStage)
        .populate('userId', 'name email picture')
        .sort({ 'stats.bestScore': -1, 'stats.totalQuizzesTaken': -1 })
        .limit(limit)
        .select('userId stats achievements');
};

module.exports = mongoose.model('UserQuizHistory', UserQuizHistorySchema);