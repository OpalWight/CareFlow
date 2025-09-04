const mongoose = require('mongoose');

const UserSkillProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Skill identification
    skillTopic: {
        type: String,
        required: true,
        // Specific skills like "Hygiene and Personal Care", "Infection Control", etc.
    },
    
    competencyArea: {
        type: String,
        required: true,
        enum: ['Physical Care Skills', 'Psychosocial Care Skills', 'Role of the Nurse Aide']
    },
    
    // Performance metrics for this specific skill
    performance: {
        totalQuestions: {
            type: Number,
            default: 0
        },
        correctAnswers: {
            type: Number,
            default: 0
        },
        accuracy: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        // Track performance over time
        trend: {
            type: String,
            enum: ['improving', 'stable', 'declining', 'insufficient_data'],
            default: 'insufficient_data'
        },
        // Categorized strength level
        strengthLevel: {
            type: String,
            enum: ['weak', 'developing', 'strong', 'mastered'],
            default: 'developing'
        },
        // Confidence interval for the accuracy
        confidenceLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        }
    },
    
    // Historical performance data
    quizHistory: [{
        quizId: String,  // References QuizPool.quizId or QuizResult._id
        quizDate: {
            type: Date,
            default: Date.now
        },
        questionsAnswered: {
            type: Number,
            required: true
        },
        correctAnswers: {
            type: Number,
            required: true
        },
        accuracy: {
            type: Number,
            required: true
        },
        // Time spent on questions for this skill in the quiz
        timeSpent: Number,
        // Difficulty of questions for this skill
        averageDifficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced']
        }
    }],
    
    // Learning analytics
    learningInsights: {
        // Identify specific areas within the skill that need work
        weakAreas: [String],
        strongAreas: [String],
        
        // Common mistake patterns
        commonMistakes: [{
            mistakeType: String,
            frequency: Number,
            lastOccurred: Date
        }],
        
        // Recommended study focus
        studyRecommendations: [{
            topic: String,
            priority: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical']
            },
            reason: String,
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }],
        
        // Estimated time to mastery based on current progress
        estimatedMasteryTime: {
            weeks: Number,
            confidence: {
                type: String,
                enum: ['low', 'medium', 'high']
            }
        }
    },
    
    // Milestone tracking
    milestones: [{
        type: {
            type: String,
            enum: ['first_correct', 'accuracy_50', 'accuracy_70', 'accuracy_85', 'mastery_achieved', 'consistency_milestone']
        },
        achievedAt: {
            type: Date,
            default: Date.now
        },
        details: String,
        accuracyAtTime: Number
    }],
    
    // Last update information
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    
    firstEncountered: {
        type: Date,
        default: Date.now
    },
    
    // Practice recommendations
    practiceStatus: {
        needsPractice: {
            type: Boolean,
            default: false
        },
        practiceUrgency: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'low'
        },
        lastPracticeDate: Date,
        recommendedPracticeFrequency: {
            type: String,
            enum: ['daily', 'every_few_days', 'weekly', 'bi_weekly', 'monthly']
        }
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
UserSkillProgressSchema.index({ userId: 1, skillTopic: 1 }, { unique: true });
UserSkillProgressSchema.index({ userId: 1, competencyArea: 1 });
UserSkillProgressSchema.index({ userId: 1, 'performance.strengthLevel': 1 });
UserSkillProgressSchema.index({ 'performance.accuracy': -1 });
UserSkillProgressSchema.index({ 'practiceStatus.needsPractice': 1, 'practiceStatus.practiceUrgency': -1 });

// Virtual for getting recent performance (last 5 quiz attempts)
UserSkillProgressSchema.virtual('recentPerformance').get(function() {
    return this.quizHistory.slice(-5);
});

// Virtual for calculating questions attempted in last month
UserSkillProgressSchema.virtual('monthlyActivity').get(function() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return this.quizHistory
        .filter(quiz => quiz.quizDate >= oneMonthAgo)
        .reduce((sum, quiz) => sum + quiz.questionsAnswered, 0);
});

// Method to update skill performance with new quiz data
UserSkillProgressSchema.methods.updateWithQuizData = function(quizData) {
    const { quizId, questionsAnswered, correctAnswers, timeSpent, averageDifficulty } = quizData;
    
    if (questionsAnswered === 0) {
        return this; // No questions for this skill in the quiz
    }
    
    const accuracy = Math.round((correctAnswers / questionsAnswered) * 100);
    
    // Add to quiz history
    this.quizHistory.push({
        quizId,
        quizDate: new Date(),
        questionsAnswered,
        correctAnswers,
        accuracy,
        timeSpent,
        averageDifficulty
    });
    
    // Keep only last 20 quiz history entries for performance
    if (this.quizHistory.length > 20) {
        this.quizHistory = this.quizHistory.slice(-20);
    }
    
    // Update overall performance metrics
    this.performance.totalQuestions += questionsAnswered;
    this.performance.correctAnswers += correctAnswers;
    this.performance.accuracy = Math.round((this.performance.correctAnswers / this.performance.totalQuestions) * 100);
    
    // Update trend analysis
    this._calculateTrend();
    
    // Update strength level
    this._calculateStrengthLevel();
    
    // Update confidence level
    this._calculateConfidenceLevel();
    
    // Update learning insights
    this._updateLearningInsights();
    
    // Update practice recommendations
    this._updatePracticeRecommendations();
    
    // Check for milestones
    this._checkMilestones();
    
    this.lastUpdated = new Date();
    
    // Use retry logic to handle version conflicts
    return this.saveWithRetry();
};

// Method to save with retry logic to handle version conflicts
UserSkillProgressSchema.methods.saveWithRetry = async function(maxRetries = 3) {
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            return await this.save();
        } catch (error) {
            if (error.name === 'VersionError' && retries < maxRetries - 1) {
                console.log(`[RETRY] Version conflict detected for UserSkillProgress ${this._id}, retry ${retries + 1}/${maxRetries}`);
                
                // Reload the document from database to get the latest version
                const fresh = await this.constructor.findById(this._id);
                if (!fresh) {
                    throw new Error('Document no longer exists');
                }
                
                // Re-apply the changes to the fresh document
                Object.assign(this, fresh.toObject());
                this.isNew = false;
                
                retries++;
                
                // Add a small delay to reduce contention
                await new Promise(resolve => setTimeout(resolve, 50 * retries));
            } else {
                throw error;
            }
        }
    }
    
    throw new Error(`Failed to save UserSkillProgress after ${maxRetries} retries`);
};

// Private method to calculate performance trend
UserSkillProgressSchema.methods._calculateTrend = function() {
    if (this.quizHistory.length < 3) {
        this.performance.trend = 'insufficient_data';
        return;
    }
    
    const recent = this.quizHistory.slice(-5);
    const older = this.quizHistory.slice(-10, -5);
    
    if (older.length === 0) {
        this.performance.trend = 'insufficient_data';
        return;
    }
    
    const recentAvg = recent.reduce((sum, quiz) => sum + quiz.accuracy, 0) / recent.length;
    const olderAvg = older.reduce((sum, quiz) => sum + quiz.accuracy, 0) / older.length;
    
    const improvement = recentAvg - olderAvg;
    
    if (improvement > 10) {
        this.performance.trend = 'improving';
    } else if (improvement < -10) {
        this.performance.trend = 'declining';
    } else {
        this.performance.trend = 'stable';
    }
};

// Private method to calculate strength level
UserSkillProgressSchema.methods._calculateStrengthLevel = function() {
    const accuracy = this.performance.accuracy;
    const totalQuestions = this.performance.totalQuestions;
    
    // Need sufficient data for reliable assessment
    if (totalQuestions < 5) {
        this.performance.strengthLevel = 'developing';
        return;
    }
    
    if (accuracy >= 90 && totalQuestions >= 20) {
        this.performance.strengthLevel = 'mastered';
    } else if (accuracy >= 80) {
        this.performance.strengthLevel = 'strong';
    } else if (accuracy >= 60) {
        this.performance.strengthLevel = 'developing';
    } else {
        this.performance.strengthLevel = 'weak';
    }
};

// Private method to calculate confidence level
UserSkillProgressSchema.methods._calculateConfidenceLevel = function() {
    const totalQuestions = this.performance.totalQuestions;
    const consistencyScore = this._calculateConsistencyScore();
    
    if (totalQuestions >= 20 && consistencyScore >= 0.8) {
        this.performance.confidenceLevel = 'high';
    } else if (totalQuestions >= 10 && consistencyScore >= 0.6) {
        this.performance.confidenceLevel = 'medium';
    } else {
        this.performance.confidenceLevel = 'low';
    }
};

// Private method to calculate consistency score
UserSkillProgressSchema.methods._calculateConsistencyScore = function() {
    if (this.quizHistory.length < 3) return 0;
    
    const recentAccuracies = this.quizHistory.slice(-5).map(quiz => quiz.accuracy);
    const mean = recentAccuracies.reduce((sum, acc) => sum + acc, 0) / recentAccuracies.length;
    
    // Calculate standard deviation
    const variance = recentAccuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / recentAccuracies.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    // Convert to 0-1 score where 1 is perfectly consistent
    return Math.max(0, Math.min(1, 1 - (standardDeviation / 50)));
};

// Private method to update learning insights
UserSkillProgressSchema.methods._updateLearningInsights = function() {
    const recommendations = [];
    
    // Determine study recommendations based on performance
    if (this.performance.strengthLevel === 'weak') {
        recommendations.push({
            topic: `${this.skillTopic} - Fundamentals`,
            priority: 'critical',
            reason: 'Low accuracy indicates need for foundational review'
        });
    } else if (this.performance.strengthLevel === 'developing') {
        recommendations.push({
            topic: `${this.skillTopic} - Practice Scenarios`,
            priority: 'high',
            reason: 'Developing skills need more practical application'
        });
    } else if (this.performance.trend === 'declining') {
        recommendations.push({
            topic: `${this.skillTopic} - Review and Reinforcement`,
            priority: 'medium',
            reason: 'Recent decline in performance detected'
        });
    }
    
    // Calculate estimated mastery time
    if (this.performance.strengthLevel !== 'mastered') {
        const currentAccuracy = this.performance.accuracy;
        const targetAccuracy = 90;
        const improvementRate = this._calculateImprovementRate();
        
        let estimatedWeeks = 0;
        let confidence = 'low';
        
        if (improvementRate > 0 && this.performance.totalQuestions >= 10) {
            const accuracyGap = targetAccuracy - currentAccuracy;
            estimatedWeeks = Math.max(1, Math.round(accuracyGap / improvementRate));
            confidence = this.performance.confidenceLevel;
        } else {
            // Default estimates based on current level
            switch (this.performance.strengthLevel) {
                case 'weak':
                    estimatedWeeks = 8;
                    break;
                case 'developing':
                    estimatedWeeks = 4;
                    break;
                case 'strong':
                    estimatedWeeks = 2;
                    break;
            }
        }
        
        this.learningInsights.estimatedMasteryTime = {
            weeks: estimatedWeeks,
            confidence
        };
    }
    
    this.learningInsights.studyRecommendations = recommendations;
};

// Private method to calculate improvement rate (accuracy points per week)
UserSkillProgressSchema.methods._calculateImprovementRate = function() {
    if (this.quizHistory.length < 3) return 0;
    
    const oldest = this.quizHistory[0];
    const newest = this.quizHistory[this.quizHistory.length - 1];
    
    const timeDiffWeeks = (newest.quizDate - oldest.quizDate) / (1000 * 60 * 60 * 24 * 7);
    if (timeDiffWeeks === 0) return 0;
    
    const accuracyImprovement = newest.accuracy - oldest.accuracy;
    return accuracyImprovement / timeDiffWeeks;
};

// Private method to update practice recommendations
UserSkillProgressSchema.methods._updatePracticeRecommendations = function() {
    const urgencyMap = {
        'weak': 'critical',
        'developing': 'high',
        'strong': 'medium',
        'mastered': 'low'
    };
    
    const frequencyMap = {
        'critical': 'daily',
        'high': 'every_few_days',
        'medium': 'weekly',
        'low': 'bi_weekly'
    };
    
    this.practiceStatus.practiceUrgency = urgencyMap[this.performance.strengthLevel];
    this.practiceStatus.needsPractice = this.performance.strengthLevel !== 'mastered';
    this.practiceStatus.recommendedPracticeFrequency = frequencyMap[this.practiceStatus.practiceUrgency];
};

// Private method to check for milestone achievements
UserSkillProgressSchema.methods._checkMilestones = function() {
    const currentAccuracy = this.performance.accuracy;
    const existingMilestones = this.milestones.map(m => m.type);
    
    const potentialMilestones = [];
    
    if (this.performance.correctAnswers > 0 && !existingMilestones.includes('first_correct')) {
        potentialMilestones.push({
            type: 'first_correct',
            details: 'First correct answer for this skill!',
            accuracyAtTime: currentAccuracy
        });
    }
    
    if (currentAccuracy >= 50 && !existingMilestones.includes('accuracy_50')) {
        potentialMilestones.push({
            type: 'accuracy_50',
            details: 'Achieved 50% accuracy!',
            accuracyAtTime: currentAccuracy
        });
    }
    
    if (currentAccuracy >= 70 && !existingMilestones.includes('accuracy_70')) {
        potentialMilestones.push({
            type: 'accuracy_70',
            details: 'Achieved 70% accuracy - Good progress!',
            accuracyAtTime: currentAccuracy
        });
    }
    
    if (currentAccuracy >= 85 && !existingMilestones.includes('accuracy_85')) {
        potentialMilestones.push({
            type: 'accuracy_85',
            details: 'Achieved 85% accuracy - Almost there!',
            accuracyAtTime: currentAccuracy
        });
    }
    
    if (this.performance.strengthLevel === 'mastered' && !existingMilestones.includes('mastery_achieved')) {
        potentialMilestones.push({
            type: 'mastery_achieved',
            details: 'Skill mastered! You\'ve achieved consistent high performance.',
            accuracyAtTime: currentAccuracy
        });
    }
    
    // Add new milestones
    this.milestones.push(...potentialMilestones);
};

// Static method to get user's overall skill progress summary
UserSkillProgressSchema.statics.getUserSkillSummary = async function(userId) {
    const skills = await this.find({ userId }).sort({ 'performance.accuracy': -1 });
    
    if (skills.length === 0) {
        return {
            totalSkills: 0,
            masteredSkills: 0,
            strongSkills: 0,
            developingSkills: 0,
            weakSkills: 0,
            overallAccuracy: 0,
            needsPractice: [],
            strengths: [],
            weaknesses: []
        };
    }
    
    const summary = {
        totalSkills: skills.length,
        masteredSkills: skills.filter(s => s.performance.strengthLevel === 'mastered').length,
        strongSkills: skills.filter(s => s.performance.strengthLevel === 'strong').length,
        developingSkills: skills.filter(s => s.performance.strengthLevel === 'developing').length,
        weakSkills: skills.filter(s => s.performance.strengthLevel === 'weak').length,
        overallAccuracy: Math.round(skills.reduce((sum, s) => sum + s.performance.accuracy, 0) / skills.length),
        needsPractice: skills.filter(s => s.practiceStatus.needsPractice && s.practiceStatus.practiceUrgency === 'critical')
                           .map(s => ({ skillTopic: s.skillTopic, accuracy: s.performance.accuracy })),
        strengths: skills.filter(s => s.performance.strengthLevel === 'mastered' || s.performance.strengthLevel === 'strong')
                        .slice(0, 3)
                        .map(s => ({ skillTopic: s.skillTopic, accuracy: s.performance.accuracy })),
        weaknesses: skills.filter(s => s.performance.strengthLevel === 'weak' || s.performance.strengthLevel === 'developing')
                         .slice(-3)
                         .map(s => ({ skillTopic: s.skillTopic, accuracy: s.performance.accuracy }))
    };
    
    return summary;
};

// Static method to find or create skill progress record
UserSkillProgressSchema.statics.findOrCreateSkill = async function(userId, skillTopic, competencyArea) {
    let skill = await this.findOne({ userId, skillTopic });
    
    if (!skill) {
        skill = new this({
            userId,
            skillTopic,
            competencyArea,
            performance: {
                totalQuestions: 0,
                correctAnswers: 0,
                accuracy: 0,
                trend: 'insufficient_data',
                strengthLevel: 'developing',
                confidenceLevel: 'low'
            },
            quizHistory: [],
            learningInsights: {
                weakAreas: [],
                strongAreas: [],
                commonMistakes: [],
                studyRecommendations: [],
                estimatedMasteryTime: { weeks: 4, confidence: 'low' }
            },
            milestones: [],
            practiceStatus: {
                needsPractice: true,
                practiceUrgency: 'medium',
                recommendedPracticeFrequency: 'weekly'
            }
        });
        
        await skill.save();
    }
    
    return skill;
};

module.exports = mongoose.model('UserSkillProgress', UserSkillProgressSchema);