const mongoose = require('mongoose');

const QuizPoolSchema = new mongoose.Schema({
    // Unique identifier for the quiz
    quizId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Quiz questions with same structure as QuizResult
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: {
            A: String,
            B: String,
            C: String,
            D: String
        },
        correctAnswer: {
            type: String,
            required: true,
            enum: ['A', 'B', 'C', 'D']
        },
        competencyArea: {
            type: String,
            required: true,
            enum: ['Physical Care Skills', 'Psychosocial Care Skills', 'Role of the Nurse Aide']
        },
        skillTopic: {
            type: String,
            // Specific topics within competency areas
        },
        explanation: String,
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'intermediate'
        }
    }],
    
    // Quiz metadata
    metadata: {
        totalQuestions: {
            type: Number,
            required: true,
            default: 30
        },
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'intermediate'
        },
        // Distribution of questions by competency area
        distribution: {
            physicalCareSkills: Number,
            psychosocialCareSkills: Number,
            roleOfNurseAide: Number
        },
        // Sources used for generation (RAG, AI, etc.)
        generationMethod: {
            type: String,
            enum: ['rag-enhanced', 'ai-fallback', 'hybrid'],
            default: 'rag-enhanced'
        },
        ragSources: [{
            contentId: String,
            relevanceScore: Number
        }],
        qualityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },
    
    // Track which users have used this quiz
    usedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        usedAt: {
            type: Date,
            default: Date.now
        },
        score: Number,
        percentage: Number
    }],
    
    // Quiz status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Usage statistics
    usageStats: {
        totalUses: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        averageCompletionTime: {
            type: Number,  // in minutes
            default: 0
        },
        difficultyRating: {
            type: Number,  // calculated based on average scores
            min: 1,
            max: 10,
            default: 5
        }
    },
    
    // Administrative fields
    createdBy: {
        type: String,
        enum: ['system', 'admin', 'ai-generator'],
        default: 'ai-generator'
    },
    
    // Retirement date for old quizzes
    retiredAt: Date,
    retirementReason: String
    
}, {
    timestamps: true
});

// Indexes for efficient queries
QuizPoolSchema.index({ isActive: 1, createdAt: -1 });
QuizPoolSchema.index({ 'metadata.difficulty': 1, isActive: 1 });
QuizPoolSchema.index({ 'usedBy.userId': 1 });
QuizPoolSchema.index({ 'usageStats.totalUses': 1, isActive: 1 });

// Virtual for getting usage count
QuizPoolSchema.virtual('timesUsed').get(function() {
    return this.usedBy.length;
});

// Virtual for checking if quiz is available (not retired and active)
QuizPoolSchema.virtual('isAvailable').get(function() {
    return this.isActive && !this.retiredAt;
});

// Method to check if user has already taken this quiz
QuizPoolSchema.methods.hasUserTaken = function(userId) {
    return this.usedBy.some(usage => usage.userId.toString() === userId.toString());
};

// Method to mark quiz as used by a user
QuizPoolSchema.methods.markAsUsed = function(userId, score, percentage, completionTime) {
    // Don't add duplicate usage
    if (this.hasUserTaken(userId)) {
        return this;
    }
    
    this.usedBy.push({
        userId,
        usedAt: new Date(),
        score,
        percentage
    });
    
    // Update usage statistics
    this.usageStats.totalUses++;
    
    // Recalculate average score
    const totalScore = this.usedBy.reduce((sum, usage) => sum + (usage.score || 0), 0);
    this.usageStats.averageScore = totalScore / this.usedBy.length;
    
    // Update completion time if provided
    if (completionTime) {
        const totalTime = this.usedBy.reduce((sum, usage) => sum + (usage.completionTime || 0), 0);
        this.usageStats.averageCompletionTime = totalTime / this.usedBy.length;
    }
    
    // Recalculate difficulty rating based on average score
    // Lower scores = higher difficulty
    this.usageStats.difficultyRating = Math.max(1, Math.min(10, 11 - Math.round(this.usageStats.averageScore / 10)));
    
    return this.save();
};

// Method to retire quiz
QuizPoolSchema.methods.retire = function(reason = 'Quality threshold not met') {
    this.isActive = false;
    this.retiredAt = new Date();
    this.retirementReason = reason;
    return this.save();
};

// Static method to find available quizzes for a user
QuizPoolSchema.statics.findAvailableForUser = async function(userId, difficulty = null, limit = 10) {
    const query = {
        isActive: true,
        retiredAt: { $exists: false },
        'usedBy.userId': { $ne: userId }
    };
    
    if (difficulty) {
        query['metadata.difficulty'] = difficulty;
    }
    
    return this.find(query)
        .sort({ createdAt: 1 })  // Oldest first to ensure fair distribution
        .limit(limit);
};

// Static method to get quiz pool statistics
QuizPoolSchema.statics.getPoolStats = async function() {
    const totalQuizzes = await this.countDocuments({ isActive: true });
    const retiredQuizzes = await this.countDocuments({ retiredAt: { $exists: true } });
    
    const usageStats = await this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                totalUses: { $sum: '$usageStats.totalUses' },
                avgQualityScore: { $avg: '$metadata.qualityScore' },
                avgDifficultyRating: { $avg: '$usageStats.difficultyRating' }
            }
        }
    ]);
    
    const difficultyDistribution = await this.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$metadata.difficulty', count: { $sum: 1 } } }
    ]);
    
    return {
        totalActiveQuizzes: totalQuizzes,
        totalRetiredQuizzes: retiredQuizzes,
        totalUses: usageStats[0]?.totalUses || 0,
        averageQualityScore: Math.round(usageStats[0]?.avgQualityScore || 0),
        averageDifficultyRating: Math.round(usageStats[0]?.avgDifficultyRating || 0),
        difficultyDistribution: difficultyDistribution.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {})
    };
};

// Static method to clean up old or low-quality quizzes
QuizPoolSchema.statics.performMaintenance = async function() {
    const maintenanceResults = {
        retiredDueToAge: 0,
        retiredDueToLowQuality: 0,
        retiredDueToLowUsage: 0
    };
    
    // Retire quizzes older than 6 months with low usage
    const oldQuizzes = await this.find({
        isActive: true,
        createdAt: { $lt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
        'usageStats.totalUses': { $lt: 5 }
    });
    
    for (const quiz of oldQuizzes) {
        await quiz.retire('Low usage after 6 months');
        maintenanceResults.retiredDueToAge++;
    }
    
    // Retire quizzes with very low quality scores
    const lowQualityQuizzes = await this.find({
        isActive: true,
        'metadata.qualityScore': { $lt: 30 }
    });
    
    for (const quiz of lowQualityQuizzes) {
        await quiz.retire('Quality score below threshold');
        maintenanceResults.retiredDueToLowQuality++;
    }
    
    return maintenanceResults;
};

module.exports = mongoose.model('QuizPool', QuizPoolSchema);