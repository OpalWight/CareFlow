const mongoose = require('mongoose');

const QuizSessionSchema = new mongoose.Schema({
    // Session identification
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    
    // User identification
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Session configuration
    configuration: {
        // Total number of questions
        questionCount: {
            type: Number,
            required: true,
            min: 1,
            max: 50
        },
        
        // Competency area distribution
        competencyDistribution: {
            physicalCareSkills: Number,
            psychosocialCareSkills: Number,
            roleOfNurseAide: Number
        },
        
        // Difficulty settings
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'adaptive'],
            default: 'adaptive'
        },
        
        // Quiz type
        quizType: {
            type: String,
            enum: ['practice', 'exam_simulation', 'review', 'focused_practice', 'spaced_repetition'],
            default: 'practice'
        },
        
        // Grading mode
        gradingMode: {
            type: String,
            enum: ['immediate', 'complete'],
            default: 'immediate'
        },
        
        // Focus areas for this session
        focusAreas: [{
            competencyArea: String,
            skillCategory: String,
            skillTopic: String,
            testSubject: String
        }],
        
        // Special settings
        settings: {
            includeReviewQuestions: {
                type: Boolean,
                default: false
            },
            avoidRecentQuestions: {
                type: Boolean,
                default: true
            },
            prioritizeWeakAreas: {
                type: Boolean,
                default: true
            },
            includeSpacedRepetition: {
                type: Boolean,
                default: true
            }
        }
    },
    
    // Selected questions for this session
    questions: [{
        // Reference to question in QuestionBank
        questionId: {
            type: String,
            ref: 'QuestionBank',
            required: true
        },
        
        // Position in the quiz (1-based)
        position: {
            type: Number,
            required: true,
            min: 1
        },
        
        // Reason this question was selected
        selectionReason: {
            type: String,
            enum: [
                'new_question',
                'weak_area_focus',
                'spaced_repetition',
                'review_question',
                'random_selection',
                'user_preference'
            ],
            default: 'random_selection'
        },
        
        // Question metadata at time of selection
        metadata: {
            competencyArea: String,
            skillCategory: String,
            skillTopic: String,
            testSubject: String,
            difficulty: String,
            qualityScore: Number
        }
    }],
    
    // User's progress through the session
    progress: {
        // Current question position (0-based)
        currentPosition: {
            type: Number,
            default: 0,
            min: 0
        },
        
        // Questions answered so far
        answeredQuestions: [{
            questionId: String,
            position: Number,
            selectedAnswer: {
                type: String,
                enum: ['A', 'B', 'C', 'D']
            },
            isCorrect: Boolean,
            timeSpent: Number, // in seconds
            answeredAt: {
                type: Date,
                default: Date.now
            }
        }],
        
        // Pending answers for complete-then-grade mode
        pendingAnswers: [{
            questionId: String,
            position: Number,
            selectedAnswer: {
                type: String,
                enum: ['A', 'B', 'C', 'D']
            },
            timeSpent: Number, // in seconds
            submittedAt: {
                type: Date,
                default: Date.now
            }
        }],
        
        // Current score
        currentScore: {
            correct: {
                type: Number,
                default: 0
            },
            total: {
                type: Number,
                default: 0
            },
            percentage: {
                type: Number,
                default: 0
            }
        },
        
        // Performance by competency area
        competencyPerformance: {
            type: Map,
            of: {
                correct: Number,
                total: Number,
                percentage: Number
            },
            default: new Map()
        }
    },
    
    // Session timing
    timing: {
        // When the session was started
        startTime: {
            type: Date,
            default: Date.now
        },
        
        // When the session was completed (null if still in progress)
        endTime: Date,
        
        // Total time spent (calculated when session ends)
        totalDuration: Number, // in seconds
        
        // Average time per question
        averageTimePerQuestion: Number, // in seconds
        
        // Time spent on individual questions
        questionTimings: [{
            questionId: String,
            position: Number,
            timeSpent: Number,
            startedAt: Date,
            answeredAt: Date
        }]
    },
    
    // Session status
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned', 'paused'],
        default: 'active'
    },
    
    // Session results (populated when completed)
    results: {
        // Final score
        finalScore: {
            correct: Number,
            total: Number,
            percentage: Number
        },
        
        // Performance breakdown
        competencyResults: {
            type: Map,
            of: {
                correct: Number,
                total: Number,
                percentage: Number,
                questions: [Number] // positions of questions in this competency
            }
        },
        
        // Question-by-question results
        questionResults: [{
            questionId: String,
            position: Number,
            selectedAnswer: String,
            correctAnswer: String,
            isCorrect: Boolean,
            timeSpent: Number,
            competencyArea: String,
            skillCategory: String,
            skillTopic: String,
            explanation: String
        }],
        
        // Session analytics
        analytics: {
            // Performance compared to user's history
            improvementFromAverage: Number,
            
            // Difficulty level achieved
            achievedDifficulty: String,
            
            // Areas of strength in this session
            strongAreas: [String],
            
            // Areas needing improvement
            weakAreas: [String],
            
            // Questions that should be reviewed
            questionsForReview: [String]
        }
    },
    
    // User preferences applied to this session
    appliedPreferences: {
        difficultyAdjustment: Boolean,
        focusOnWeakAreas: Boolean,
        includeReview: Boolean,
        avoidRecent: Boolean,
        spacedRepetition: Boolean
    },
    
    // Metadata
    metadata: {
        // Source of session creation
        createdBy: {
            type: String,
            enum: ['user_request', 'scheduled_practice', 'recommendation_system'],
            default: 'user_request'
        },
        
        // Device/platform used
        platform: String,
        
        // User agent
        userAgent: String,
        
        // IP address (for analytics)
        ipAddress: String,
        
        // Template used (if any)
        templateUsed: String
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
QuizSessionSchema.index({ userId: 1, status: 1 });
QuizSessionSchema.index({ userId: 1, createdAt: -1 });
QuizSessionSchema.index({ sessionId: 1 });
QuizSessionSchema.index({ status: 1, 'timing.startTime': -1 });
QuizSessionSchema.index({ userId: 1, 'configuration.quizType': 1 });

// Virtual for checking if session is in progress
QuizSessionSchema.virtual('isActive').get(function() {
    return this.status === 'active';
});

// Virtual for calculating completion percentage
QuizSessionSchema.virtual('completionPercentage').get(function() {
    if (this.configuration.questionCount === 0) return 0;
    return Math.round((this.progress.answeredQuestions.length / this.configuration.questionCount) * 100);
});

// Virtual for getting current question
QuizSessionSchema.virtual('currentQuestion').get(function() {
    if (this.progress.currentPosition >= this.questions.length) return null;
    return this.questions[this.progress.currentPosition];
});

// Virtual for getting remaining questions
QuizSessionSchema.virtual('remainingQuestions').get(function() {
    return this.configuration.questionCount - this.progress.answeredQuestions.length;
});

// Method to answer a question
QuizSessionSchema.methods.answerQuestion = function(questionId, selectedAnswer, timeSpent = 0) {
    // Find the question in our question list
    const question = this.questions.find(q => q.questionId === questionId);
    if (!question) {
        throw new Error('Question not found in this session');
    }
    
    // Check if question has already been answered
    const alreadyAnswered = this.progress.answeredQuestions.find(a => a.questionId === questionId);
    if (alreadyAnswered) {
        throw new Error('Question has already been answered');
    }
    
    // We need to get the correct answer from the QuestionBank
    // This would typically be done in the service layer
    // For now, we'll mark it as needing verification
    const answerRecord = {
        questionId,
        position: question.position,
        selectedAnswer,
        isCorrect: null, // Will be set by service layer
        timeSpent: Math.max(0, timeSpent),
        answeredAt: new Date()
    };
    
    this.progress.answeredQuestions.push(answerRecord);
    
    // Update current position
    const oldPosition = this.progress.currentPosition;
    this.progress.currentPosition++;
    
    console.log(`🔍 DEBUG: Position updated from ${oldPosition} to ${this.progress.currentPosition}`);
    console.log(`🔍 DEBUG: Total questions in session: ${this.questions.length}, config count: ${this.configuration.questionCount}`);
    
    // Add timing record
    this.timing.questionTimings.push({
        questionId,
        position: question.position,
        timeSpent,
        startedAt: new Date(Date.now() - (timeSpent * 1000)),
        answeredAt: new Date()
    });
    
    return this.save();
};

// Method to complete the session
QuizSessionSchema.methods.completeSession = function() {
    if (this.status !== 'active') {
        throw new Error('Session is not active');
    }
    
    this.status = 'completed';
    this.timing.endTime = new Date();
    
    // Calculate total duration
    if (this.timing.startTime) {
        this.timing.totalDuration = Math.round((this.timing.endTime - this.timing.startTime) / 1000);
    }
    
    // Calculate average time per question
    if (this.progress.answeredQuestions.length > 0) {
        const totalTime = this.progress.answeredQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
        this.timing.averageTimePerQuestion = Math.round(totalTime / this.progress.answeredQuestions.length);
    }
    
    // Final score will be calculated by service layer after verifying answers
    
    return this.save();
};

// Method to abandon the session
QuizSessionSchema.methods.abandonSession = function(reason = 'User abandoned') {
    if (this.status === 'completed') {
        throw new Error('Cannot abandon a completed session');
    }
    
    this.status = 'abandoned';
    this.timing.endTime = new Date();
    this.metadata.abandonReason = reason;
    
    // Calculate duration up to abandonment
    if (this.timing.startTime) {
        this.timing.totalDuration = Math.round((this.timing.endTime - this.timing.startTime) / 1000);
    }
    
    return this.save();
};

// Method to pause the session
QuizSessionSchema.methods.pauseSession = function() {
    if (this.status !== 'active') {
        throw new Error('Can only pause active sessions');
    }
    
    this.status = 'paused';
    this.timing.pausedAt = new Date();
    
    return this.save();
};

// Method to resume a paused session
QuizSessionSchema.methods.resumeSession = function() {
    if (this.status !== 'paused') {
        throw new Error('Session is not paused');
    }
    
    this.status = 'active';
    
    // Calculate pause duration and adjust timings if needed
    if (this.timing.pausedAt) {
        const pauseDuration = Date.now() - this.timing.pausedAt.getTime();
        this.timing.totalPauseDuration = (this.timing.totalPauseDuration || 0) + pauseDuration;
        delete this.timing.pausedAt;
    }
    
    return this.save();
};

// Method to get next question
QuizSessionSchema.methods.getNextQuestion = function() {
    if (this.progress.currentPosition >= this.questions.length) {
        return null; // No more questions
    }
    
    return this.questions[this.progress.currentPosition];
};

// Method to get question by position
QuizSessionSchema.methods.getQuestionByPosition = function(position) {
    return this.questions.find(q => q.position === position);
};

// Method to update progress score (called after answer verification)
QuizSessionSchema.methods.updateProgress = function(questionId, isCorrect) {
    const answerRecord = this.progress.answeredQuestions.find(a => a.questionId === questionId);
    if (!answerRecord) {
        throw new Error('Answer record not found');
    }
    
    answerRecord.isCorrect = isCorrect;
    
    // Update current score
    this.progress.currentScore.total = this.progress.answeredQuestions.length;
    this.progress.currentScore.correct = this.progress.answeredQuestions.filter(a => a.isCorrect).length;
    this.progress.currentScore.percentage = Math.round(
        (this.progress.currentScore.correct / this.progress.currentScore.total) * 100
    );
    
    // Update competency performance
    const question = this.questions.find(q => q.questionId === questionId);
    if (question && question.metadata.competencyArea) {
        const competency = question.metadata.competencyArea;
        let competencyStats = this.progress.competencyPerformance.get(competency);
        
        if (!competencyStats) {
            competencyStats = { correct: 0, total: 0, percentage: 0 };
        }
        
        competencyStats.total++;
        if (isCorrect) {
            competencyStats.correct++;
        }
        competencyStats.percentage = Math.round((competencyStats.correct / competencyStats.total) * 100);
        
        this.progress.competencyPerformance.set(competency, competencyStats);
    }
    
    return this.save();
};

// Static method to generate unique session ID
QuizSessionSchema.statics.generateSessionId = function() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${random}`;
};

// Static method to find active session for user
QuizSessionSchema.statics.findActiveSession = async function(userId) {
    return this.findOne({ 
        userId, 
        status: { $in: ['active', 'paused'] } 
    }).sort({ createdAt: -1 });
};

// Static method to get user's session history
QuizSessionSchema.statics.getUserHistory = async function(userId, options = {}) {
    const { limit = 10, skip = 0, quizType, status } = options;
    
    const query = { userId };
    if (quizType) query['configuration.quizType'] = quizType;
    if (status) query.status = status;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('sessionId status configuration.quizType timing results.finalScore createdAt');
};

// Static method to clean up old abandoned sessions
QuizSessionSchema.statics.cleanupOldSessions = async function() {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const result = await this.updateMany(
        {
            status: 'active',
            createdAt: { $lt: cutoffDate }
        },
        {
            $set: {
                status: 'abandoned',
                'metadata.abandonReason': 'Auto-abandoned due to inactivity',
                'timing.endTime': new Date()
            }
        }
    );
    
    return result.modifiedCount;
};

module.exports = mongoose.model('QuizSession', QuizSessionSchema);