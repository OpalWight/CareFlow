const mongoose = require('mongoose');
const { COMPETENCY_AREAS, SKILL_CATEGORIES, SKILL_TOPICS, TEST_SUBJECTS, DIFFICULTIES, CORRECT_ANSWERS } = require('../constants/questionEnums');

const QuestionBankSchema = new mongoose.Schema({
    // Unique identifier for the question
    questionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Question content
    question: {
        type: String,
        required: true
    },
    
    // Multiple choice options
    options: {
        A: {
            type: String,
            required: true
        },
        B: {
            type: String,
            required: true
        },
        C: {
            type: String,
            required: true
        },
        D: {
            type: String,
            required: true
        }
    },
    
    // Correct answer
    correctAnswer: {
        type: String,
        required: true,
        enum: CORRECT_ANSWERS
    },
    
    // Explanation for the correct answer
    explanation: {
        type: String,
        required: true
    },
    
    // Competency categorization
    competencyArea: {
        type: String,
        required: true,
        enum: COMPETENCY_AREAS
    },
    
    // Specific skill category within competency area
    skillCategory: {
        type: String,
        required: true,
        enum: SKILL_CATEGORIES
    },
    
    // Specific skill topic within category
    skillTopic: {
        type: String,
        required: true,
        enum: SKILL_TOPICS
    },
    
    // Test subjects for certification exam categorization
    testSubject: {
        type: String,
        required: true,
        enum: TEST_SUBJECTS
    },
    
    // Question difficulty level
    difficulty: {
        type: String,
        enum: DIFFICULTIES,
        default: 'intermediate'
    },
    
    // Question metadata
    metadata: {
        // How this question was generated
        generationMethod: {
            type: String,
            enum: ['rag-enhanced', 'ai-generated', 'manual', 'imported'],
            default: 'ai-generated'
        },
        
        // RAG sources used (if applicable)
        ragSources: [{
            contentId: String,
            relevanceScore: Number
        }],
        
        // Question quality score
        qualityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 70
        },
        
        // Question complexity indicators
        complexity: {
            type: String,
            enum: ['factual', 'conceptual', 'application', 'analysis'],
            default: 'conceptual'
        },
        
        // Estimated time to answer (in seconds)
        estimatedTime: {
            type: Number,
            default: 90
        }
    },
    
    // Usage statistics
    usageStats: {
        // Total times this question has been used
        totalUses: {
            type: Number,
            default: 0
        },
        
        // Times answered correctly
        correctAnswers: {
            type: Number,
            default: 0
        },
        
        // Accuracy percentage
        accuracy: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        
        // Average time spent on this question
        averageTimeSpent: {
            type: Number,
            default: 0
        },
        
        // Difficulty rating based on user performance
        performanceDifficulty: {
            type: Number,
            min: 1,
            max: 10,
            default: 5
        },
        
        // Last time this question was used
        lastUsed: Date
    },
    
    // Question lifecycle management
    status: {
        type: String,
        enum: ['active', 'review', 'retired', 'draft'],
        default: 'active'
    },
    
    // Retirement information
    retiredAt: Date,
    retirementReason: String,
    
    // Administrative fields
    createdBy: {
        type: String,
        enum: ['system', 'admin', 'ai-generator', 'import'],
        default: 'ai-generator'
    },
    
    // Tags for flexible categorization
    tags: [String],
    
    // Version tracking for question updates
    version: {
        type: Number,
        default: 1
    },
    
    // Review information
    reviewInfo: {
        lastReviewed: Date,
        reviewedBy: String,
        reviewNotes: String,
        needsReview: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
QuestionBankSchema.index({ competencyArea: 1, difficulty: 1, status: 1 });
QuestionBankSchema.index({ skillCategory: 1, status: 1 });
QuestionBankSchema.index({ skillTopic: 1, status: 1 });
QuestionBankSchema.index({ testSubject: 1, status: 1 });
QuestionBankSchema.index({ competencyArea: 1, skillCategory: 1, status: 1 });
QuestionBankSchema.index({ 'usageStats.accuracy': 1, status: 1 });
QuestionBankSchema.index({ 'metadata.qualityScore': -1, status: 1 });
QuestionBankSchema.index({ 'usageStats.lastUsed': -1, status: 1 });
QuestionBankSchema.index({ tags: 1, status: 1 });

// Virtual for checking if question is available for use
QuestionBankSchema.virtual('isAvailable').get(function() {
    return this.status === 'active' && !this.retiredAt;
});

// Virtual for calculating difficulty based on accuracy
QuestionBankSchema.virtual('actualDifficulty').get(function() {
    if (this.usageStats.totalUses < 5) return 'insufficient_data';
    
    const accuracy = this.usageStats.accuracy;
    if (accuracy >= 80) return 'easy';
    if (accuracy >= 60) return 'moderate';
    if (accuracy >= 40) return 'hard';
    return 'very_hard';
});

// Method to update usage statistics
QuestionBankSchema.methods.updateUsageStats = function(isCorrect, timeSpent) {
    this.usageStats.totalUses++;
    if (isCorrect) {
        this.usageStats.correctAnswers++;
    }
    
    // Update accuracy
    this.usageStats.accuracy = Math.round(
        (this.usageStats.correctAnswers / this.usageStats.totalUses) * 100
    );
    
    // Update average time spent
    if (timeSpent && timeSpent > 0) {
        const currentAvg = this.usageStats.averageTimeSpent || 0;
        const currentCount = this.usageStats.totalUses - 1;
        this.usageStats.averageTimeSpent = Math.round(
            ((currentAvg * currentCount) + timeSpent) / this.usageStats.totalUses
        );
    }
    
    // Update performance difficulty rating (1-10 scale, 10 = most difficult)
    const accuracy = this.usageStats.accuracy;
    this.usageStats.performanceDifficulty = Math.max(1, Math.min(10, 
        Math.round(11 - (accuracy / 10))
    ));
    
    this.usageStats.lastUsed = new Date();
    
    // Auto-retire questions with very low accuracy after sufficient attempts
    if (this.usageStats.totalUses >= 50 && this.usageStats.accuracy < 20) {
        this.status = 'review';
        this.reviewInfo.needsReview = true;
        this.reviewInfo.reviewNotes = 'Automatically flagged for review - very low accuracy';
    }
    
    return this.save();
};

// Method to retire a question
QuestionBankSchema.methods.retire = function(reason = 'Manual retirement') {
    this.status = 'retired';
    this.retiredAt = new Date();
    this.retirementReason = reason;
    return this.save();
};

// Method to mark question for review
QuestionBankSchema.methods.flagForReview = function(reason = 'Flagged for review') {
    this.status = 'review';
    this.reviewInfo.needsReview = true;
    this.reviewInfo.reviewNotes = reason;
    this.reviewInfo.lastReviewed = new Date();
    return this.save();
};

// Static method to get questions by criteria
QuestionBankSchema.statics.findByCriteria = async function(criteria = {}) {
    const {
        competencyArea,
        skillCategory,
        skillTopic,
        testSubject,
        difficulty,
        minQuality = 50,
        excludeRecent = false,
        recentTimeframe = 7 * 24 * 60 * 60 * 1000, // 7 days
        limit = 50
    } = criteria;
    
    console.log(`[QUIZ-DEBUG] 🔍 QuestionBank.findByCriteria called with:`, criteria);
    
    const query = { status: 'active' };
    
    if (competencyArea) query.competencyArea = competencyArea;
    if (skillCategory) query.skillCategory = skillCategory;
    if (skillTopic) query.skillTopic = skillTopic;
    if (testSubject) query.testSubject = testSubject;
    if (difficulty) query.difficulty = difficulty;
    if (minQuality > 0) query['metadata.qualityScore'] = { $gte: minQuality };
    
    // Exclude recently used questions if requested
    if (excludeRecent) {
        const cutoffDate = new Date(Date.now() - recentTimeframe);
        query.$or = [
            { 'usageStats.lastUsed': { $exists: false } },
            { 'usageStats.lastUsed': { $lt: cutoffDate } }
        ];
    }
    
    console.log(`[QUIZ-DEBUG] 📋 MongoDB query:`, JSON.stringify(query, null, 2));
    
    // Get total count without filters first for debugging
    const totalActiveCount = await this.countDocuments({ status: 'active' });
    const competencyCount = competencyArea ? await this.countDocuments({ status: 'active', competencyArea }) : 0;
    
    console.log(`[QUIZ-DEBUG] 📊 Database stats:`, {
        totalActiveQuestions: totalActiveCount,
        competencyAreaQuestions: competencyCount,
        competencyArea: competencyArea || 'all'
    });
    
    const queryStart = Date.now();
    const results = await this.find(query)
        .sort({ 'usageStats.lastUsed': 1, 'metadata.qualityScore': -1 })
        .limit(limit);
    const queryTime = Date.now() - queryStart;
    
    console.log(`[QUIZ-DEBUG] ✅ Query completed in ${queryTime}ms:`, {
        resultsFound: results.length,
        requestedLimit: limit,
        totalWithoutFilters: competencyCount,
        competencyArea: competencyArea || 'all',
        appliedFilters: {
            difficulty: difficulty || 'any',
            minQuality: minQuality,
            excludeRecent: excludeRecent
        }
    });
    
    return results;
};

// Static method to get pool statistics
QuestionBankSchema.statics.getPoolStats = async function() {
    const totalQuestions = await this.countDocuments({ status: 'active' });
    
    const competencyStats = await this.aggregate([
        { $match: { status: 'active' } },
        {
            $group: {
                _id: '$competencyArea',
                count: { $sum: 1 },
                avgQuality: { $avg: '$metadata.qualityScore' },
                avgAccuracy: { $avg: '$usageStats.accuracy' }
            }
        }
    ]);
    
    const categoryStats = await this.aggregate([
        { $match: { status: 'active' } },
        {
            $group: {
                _id: { competencyArea: '$competencyArea', skillCategory: '$skillCategory' },
                count: { $sum: 1 },
                avgQuality: { $avg: '$metadata.qualityScore' },
                avgAccuracy: { $avg: '$usageStats.accuracy' }
            }
        }
    ]);
    
    const testSubjectStats = await this.aggregate([
        { $match: { status: 'active' } },
        {
            $group: {
                _id: '$testSubject',
                count: { $sum: 1 },
                avgQuality: { $avg: '$metadata.qualityScore' },
                avgAccuracy: { $avg: '$usageStats.accuracy' }
            }
        }
    ]);
    
    const difficultyStats = await this.aggregate([
        { $match: { status: 'active' } },
        {
            $group: {
                _id: '$difficulty',
                count: { $sum: 1 },
                avgQuality: { $avg: '$metadata.qualityScore' }
            }
        }
    ]);
    
    return {
        totalActiveQuestions: totalQuestions,
        competencyDistribution: competencyStats.reduce((acc, stat) => {
            acc[stat._id] = {
                count: stat.count,
                percentage: Math.round((stat.count / totalQuestions) * 100),
                avgQuality: Math.round(stat.avgQuality || 0),
                avgAccuracy: Math.round(stat.avgAccuracy || 0)
            };
            return acc;
        }, {}),
        categoryDistribution: categoryStats.reduce((acc, stat) => {
            const key = `${stat._id.competencyArea} - ${stat._id.skillCategory}`;
            acc[key] = {
                competencyArea: stat._id.competencyArea,
                skillCategory: stat._id.skillCategory,
                count: stat.count,
                percentage: Math.round((stat.count / totalQuestions) * 100),
                avgQuality: Math.round(stat.avgQuality || 0),
                avgAccuracy: Math.round(stat.avgAccuracy || 0)
            };
            return acc;
        }, {}),
        testSubjectDistribution: testSubjectStats.reduce((acc, stat) => {
            acc[stat._id] = {
                count: stat.count,
                percentage: Math.round((stat.count / totalQuestions) * 100),
                avgQuality: Math.round(stat.avgQuality || 0),
                avgAccuracy: Math.round(stat.avgAccuracy || 0)
            };
            return acc;
        }, {}),
        difficultyDistribution: difficultyStats.reduce((acc, stat) => {
            acc[stat._id] = {
                count: stat.count,
                percentage: Math.round((stat.count / totalQuestions) * 100),
                avgQuality: Math.round(stat.avgQuality || 0)
            };
            return acc;
        }, {})
    };
};

// Static method to find questions needing review
QuestionBankSchema.statics.findNeedingReview = async function() {
    return this.find({
        $or: [
            { status: 'review' },
            { 'reviewInfo.needsReview': true },
            { 
                status: 'active',
                'usageStats.totalUses': { $gte: 100 },
                'usageStats.accuracy': { $lt: 30 }
            }
        ]
    }).sort({ 'reviewInfo.lastReviewed': 1 });
};

// Static method for cleanup and maintenance
QuestionBankSchema.statics.performMaintenance = async function() {
    const maintenanceResults = {
        retiredLowQuality: 0,
        flaggedForReview: 0,
        updated: 0
    };
    
    // Find questions with very low quality scores that haven't been reviewed recently
    const lowQualityQuestions = await this.find({
        status: 'active',
        'metadata.qualityScore': { $lt: 30 },
        $or: [
            { 'reviewInfo.lastReviewed': { $exists: false } },
            { 'reviewInfo.lastReviewed': { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        ]
    });
    
    for (const question of lowQualityQuestions) {
        await question.flagForReview('Low quality score - needs manual review');
        maintenanceResults.flaggedForReview++;
    }
    
    return maintenanceResults;
};

module.exports = mongoose.model('QuestionBank', QuestionBankSchema);