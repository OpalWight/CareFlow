const mongoose = require('mongoose');

const UserQuestionProgressSchema = new mongoose.Schema({
    // User identification
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Question identification
    questionId: {
        type: String,
        ref: 'QuestionBank',
        required: true,
        index: true
    },
    
    // Progress tracking
    attempts: [{
        // When this attempt was made
        attemptedAt: {
            type: Date,
            default: Date.now
        },
        
        // User's selected answer
        selectedAnswer: {
            type: String,
            enum: ['A', 'B', 'C', 'D'],
            required: true
        },
        
        // Whether the answer was correct
        isCorrect: {
            type: Boolean,
            required: true
        },
        
        // Time spent on this question (in seconds)
        timeSpent: {
            type: Number,
            min: 0,
            default: 0
        },
        
        // Difficulty level when answered
        difficultyLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'intermediate'
        },
        
        // Context in which question was answered
        context: {
            quizSessionId: String,
            position: Number, // Position in quiz (1-30)
            totalQuestions: Number
        }
    }],
    
    // Summary statistics
    stats: {
        // Total number of attempts
        totalAttempts: {
            type: Number,
            default: 0
        },
        
        // Number of correct attempts
        correctAttempts: {
            type: Number,
            default: 0
        },
        
        // Current accuracy percentage
        accuracy: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        
        // Average time spent per attempt
        averageTimeSpent: {
            type: Number,
            default: 0
        },
        
        // First attempt date
        firstAttempt: Date,
        
        // Most recent attempt date
        lastAttempt: Date,
        
        // Whether user has mastered this question (consistently correct)
        isMastered: {
            type: Boolean,
            default: false
        },
        
        // Consecutive correct attempts
        currentStreak: {
            type: Number,
            default: 0
        },
        
        // Best streak of correct attempts
        bestStreak: {
            type: Number,
            default: 0
        }
    },
    
    // Learning analytics
    learningData: {
        // Performance trend
        trend: {
            type: String,
            enum: ['improving', 'stable', 'declining', 'insufficient_data'],
            default: 'insufficient_data'
        },
        
        // Difficulty progression (how user performed at different difficulty levels)
        difficultyPerformance: {
            beginner: {
                attempts: { type: Number, default: 0 },
                correct: { type: Number, default: 0 },
                accuracy: { type: Number, default: 0 }
            },
            intermediate: {
                attempts: { type: Number, default: 0 },
                correct: { type: Number, default: 0 },
                accuracy: { type: Number, default: 0 }
            },
            advanced: {
                attempts: { type: Number, default: 0 },
                correct: { type: Number, default: 0 },
                accuracy: { type: Number, default: 0 }
            }
        },
        
        // Speed analysis
        speedAnalysis: {
            isFast: Boolean, // Answered faster than average
            isSlow: Boolean, // Answered slower than average
            speedTrend: {
                type: String,
                enum: ['getting_faster', 'getting_slower', 'stable', 'insufficient_data'],
                default: 'insufficient_data'
            }
        },
        
        // Common mistakes (if any pattern detected)
        commonMistakes: [{
            incorrectAnswer: {
                type: String,
                enum: ['A', 'B', 'C', 'D']
            },
            frequency: Number,
            lastOccurred: Date
        }],
        
        // Next review recommendation
        nextReview: {
            recommendedDate: Date,
            priority: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'medium'
            },
            reason: String
        }
    },
    
    // Spaced repetition data
    spacedRepetition: {
        // Current interval between reviews (in days)
        currentInterval: {
            type: Number,
            default: 1
        },
        
        // Ease factor for spaced repetition algorithm
        easeFactor: {
            type: Number,
            default: 2.5,
            min: 1.3
        },
        
        // Due date for next review
        dueDate: {
            type: Date,
            default: Date.now
        },
        
        // Number of times this question has been reviewed
        reviewCount: {
            type: Number,
            default: 0
        },
        
        // Whether this question is currently due for review
        isDue: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
UserQuestionProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });
UserQuestionProgressSchema.index({ userId: 1, 'stats.lastAttempt': -1 });
UserQuestionProgressSchema.index({ userId: 1, 'stats.accuracy': 1 });
UserQuestionProgressSchema.index({ userId: 1, 'stats.isMastered': 1 });
UserQuestionProgressSchema.index({ userId: 1, 'spacedRepetition.isDue': 1, 'spacedRepetition.dueDate': 1 });
UserQuestionProgressSchema.index({ 'learningData.nextReview.priority': -1, 'learningData.nextReview.recommendedDate': 1 });

// Virtual for getting recent performance (last 5 attempts)
UserQuestionProgressSchema.virtual('recentPerformance').get(function() {
    return this.attempts.slice(-5);
});

// Virtual for checking if question needs practice
UserQuestionProgressSchema.virtual('needsPractice').get(function() {
    return !this.stats.isMastered && (
        this.stats.accuracy < 80 || 
        this.stats.currentStreak < 3 ||
        this.spacedRepetition.isDue
    );
});

// Method to record a new attempt
UserQuestionProgressSchema.methods.recordAttempt = function(attemptData) {
    const { selectedAnswer, isCorrect, timeSpent = 0, difficultyLevel = 'intermediate', context = {} } = attemptData;
    
    // Add new attempt
    this.attempts.push({
        attemptedAt: new Date(),
        selectedAnswer,
        isCorrect,
        timeSpent,
        difficultyLevel,
        context
    });
    
    // Update summary statistics
    this.stats.totalAttempts++;
    if (isCorrect) {
        this.stats.correctAttempts++;
        this.stats.currentStreak++;
        if (this.stats.currentStreak > this.stats.bestStreak) {
            this.stats.bestStreak = this.stats.currentStreak;
        }
    } else {
        this.stats.currentStreak = 0;
        // Track common mistakes
        this._trackMistake(selectedAnswer);
    }
    
    // Update accuracy
    this.stats.accuracy = Math.round((this.stats.correctAttempts / this.stats.totalAttempts) * 100);
    
    // Update timing statistics
    if (timeSpent > 0) {
        const currentAvg = this.stats.averageTimeSpent || 0;
        const currentCount = this.stats.totalAttempts - 1;
        this.stats.averageTimeSpent = Math.round(
            ((currentAvg * currentCount) + timeSpent) / this.stats.totalAttempts
        );
    }
    
    // Update dates
    if (!this.stats.firstAttempt) {
        this.stats.firstAttempt = new Date();
    }
    this.stats.lastAttempt = new Date();
    
    // Update difficulty performance
    this._updateDifficultyPerformance(difficultyLevel, isCorrect);
    
    // Update learning analytics
    this._updateLearningAnalytics();
    
    // Update spaced repetition
    this._updateSpacedRepetition(isCorrect);
    
    // Check for mastery
    this._checkMastery();
    
    return this.save();
};

// Private method to track common mistakes
UserQuestionProgressSchema.methods._trackMistake = function(incorrectAnswer) {
    const existing = this.learningData.commonMistakes.find(m => m.incorrectAnswer === incorrectAnswer);
    if (existing) {
        existing.frequency++;
        existing.lastOccurred = new Date();
    } else {
        this.learningData.commonMistakes.push({
            incorrectAnswer,
            frequency: 1,
            lastOccurred: new Date()
        });
    }
};

// Private method to update difficulty performance
UserQuestionProgressSchema.methods._updateDifficultyPerformance = function(difficultyLevel, isCorrect) {
    const diffPerf = this.learningData.difficultyPerformance[difficultyLevel];
    if (diffPerf) {
        diffPerf.attempts++;
        if (isCorrect) {
            diffPerf.correct++;
        }
        diffPerf.accuracy = Math.round((diffPerf.correct / diffPerf.attempts) * 100);
    }
};

// Private method to update learning analytics
UserQuestionProgressSchema.methods._updateLearningAnalytics = function() {
    // Calculate performance trend
    if (this.attempts.length >= 5) {
        const recent = this.attempts.slice(-3);
        const older = this.attempts.slice(-6, -3);
        
        if (older.length > 0) {
            const recentAccuracy = recent.filter(a => a.isCorrect).length / recent.length;
            const olderAccuracy = older.filter(a => a.isCorrect).length / older.length;
            
            if (recentAccuracy > olderAccuracy + 0.2) {
                this.learningData.trend = 'improving';
            } else if (recentAccuracy < olderAccuracy - 0.2) {
                this.learningData.trend = 'declining';
            } else {
                this.learningData.trend = 'stable';
            }
        }
    }
    
    // Calculate speed analysis
    if (this.stats.averageTimeSpent > 0) {
        // These would ideally be compared to global averages
        this.learningData.speedAnalysis.isFast = this.stats.averageTimeSpent < 60;
        this.learningData.speedAnalysis.isSlow = this.stats.averageTimeSpent > 120;
    }
    
    // Set next review recommendation
    this._setNextReviewRecommendation();
};

// Private method to set next review recommendation
UserQuestionProgressSchema.methods._setNextReviewRecommendation = function() {
    const now = new Date();
    let priority = 'medium';
    let recommendedDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default: 1 week
    let reason = 'Regular review';
    
    if (this.stats.accuracy < 50) {
        priority = 'critical';
        recommendedDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
        reason = 'Low accuracy - needs immediate attention';
    } else if (this.stats.accuracy < 70) {
        priority = 'high';
        recommendedDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
        reason = 'Below target accuracy';
    } else if (this.stats.currentStreak >= 3 && this.stats.accuracy >= 90) {
        priority = 'low';
        recommendedDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        reason = 'Strong performance - extended interval';
    }
    
    this.learningData.nextReview = {
        recommendedDate,
        priority,
        reason
    };
};

// Private method to update spaced repetition algorithm
UserQuestionProgressSchema.methods._updateSpacedRepetition = function(isCorrect) {
    this.spacedRepetition.reviewCount++;
    
    if (isCorrect) {
        // Increase interval and ease factor
        if (this.spacedRepetition.reviewCount === 1) {
            this.spacedRepetition.currentInterval = 1;
        } else if (this.spacedRepetition.reviewCount === 2) {
            this.spacedRepetition.currentInterval = 6;
        } else {
            this.spacedRepetition.currentInterval = Math.round(
                this.spacedRepetition.currentInterval * this.spacedRepetition.easeFactor
            );
        }
        
        // Adjust ease factor slightly up for correct answers
        this.spacedRepetition.easeFactor = Math.min(3.0, this.spacedRepetition.easeFactor + 0.1);
    } else {
        // Reset interval and adjust ease factor down for incorrect answers
        this.spacedRepetition.currentInterval = 1;
        this.spacedRepetition.easeFactor = Math.max(1.3, this.spacedRepetition.easeFactor - 0.2);
    }
    
    // Set next due date
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + this.spacedRepetition.currentInterval);
    this.spacedRepetition.dueDate = nextDue;
    this.spacedRepetition.isDue = false; // Will be updated by background job
};

// Private method to check for mastery
UserQuestionProgressSchema.methods._checkMastery = function() {
    // Consider mastered if:
    // - At least 5 attempts
    // - 90%+ accuracy
    // - Current streak of at least 3
    // - Last 3 attempts were correct
    
    if (this.stats.totalAttempts >= 5 && 
        this.stats.accuracy >= 90 && 
        this.stats.currentStreak >= 3) {
        
        const lastThree = this.attempts.slice(-3);
        const allLastThreeCorrect = lastThree.length === 3 && lastThree.every(a => a.isCorrect);
        
        if (allLastThreeCorrect) {
            this.stats.isMastered = true;
            this.spacedRepetition.isDue = false;
            this.learningData.nextReview.priority = 'low';
        }
    } else {
        this.stats.isMastered = false;
    }
};

// Static method to find questions due for review for a user
UserQuestionProgressSchema.statics.findDueForReview = async function(userId, limit = 10) {
    const now = new Date();
    return this.find({
        userId,
        'spacedRepetition.isDue': true,
        'spacedRepetition.dueDate': { $lte: now }
    })
    .sort({ 'learningData.nextReview.priority': -1, 'spacedRepetition.dueDate': 1 })
    .limit(limit);
};

// Static method to get user's overall question progress statistics
UserQuestionProgressSchema.statics.getUserStats = async function(userId) {
    const userQuestions = await this.find({ userId });
    
    if (userQuestions.length === 0) {
        return {
            totalQuestions: 0,
            masteredQuestions: 0,
            averageAccuracy: 0,
            totalAttempts: 0,
            questionsNeedingReview: 0,
            strengthAreas: [],
            weakAreas: []
        };
    }
    
    const totalAttempts = userQuestions.reduce((sum, q) => sum + q.stats.totalAttempts, 0);
    const totalAccuracy = userQuestions.reduce((sum, q) => sum + (q.stats.accuracy || 0), 0);
    const masteredCount = userQuestions.filter(q => q.stats.isMastered).length;
    const needsReviewCount = userQuestions.filter(q => q.needsPractice).length;
    
    return {
        totalQuestions: userQuestions.length,
        masteredQuestions: masteredCount,
        averageAccuracy: Math.round(totalAccuracy / userQuestions.length),
        totalAttempts,
        questionsNeedingReview: needsReviewCount,
        masteryPercentage: Math.round((masteredCount / userQuestions.length) * 100)
    };
};

// Static method to find or create progress record for a question
UserQuestionProgressSchema.statics.findOrCreate = async function(userId, questionId) {
    let progress = await this.findOne({ userId, questionId });
    
    if (!progress) {
        progress = new this({
            userId,
            questionId,
            attempts: [],
            stats: {
                totalAttempts: 0,
                correctAttempts: 0,
                accuracy: 0,
                averageTimeSpent: 0,
                currentStreak: 0,
                bestStreak: 0,
                isMastered: false
            },
            learningData: {
                trend: 'insufficient_data',
                difficultyPerformance: {
                    beginner: { attempts: 0, correct: 0, accuracy: 0 },
                    intermediate: { attempts: 0, correct: 0, accuracy: 0 },
                    advanced: { attempts: 0, correct: 0, accuracy: 0 }
                },
                speedAnalysis: {
                    speedTrend: 'insufficient_data'
                },
                commonMistakes: [],
                nextReview: {
                    recommendedDate: new Date(),
                    priority: 'medium',
                    reason: 'New question'
                }
            },
            spacedRepetition: {
                currentInterval: 1,
                easeFactor: 2.5,
                dueDate: new Date(),
                reviewCount: 0,
                isDue: true
            }
        });
        
        await progress.save();
    }
    
    return progress;
};

module.exports = mongoose.model('UserQuestionProgress', UserQuestionProgressSchema);