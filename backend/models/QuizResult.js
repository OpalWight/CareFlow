const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
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
        userAnswer: {
            type: String,
            enum: ['A', 'B', 'C', 'D'],
            default: null
        },
        isCorrect: {
            type: Boolean,
            default: false
        },
        competencyArea: {
            type: String,
            required: true
        },
        explanation: String
    }],
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 30
    },
    totalQuestions: {
        type: Number,
        required: true,
        default: 30
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    competencyAnalysis: {
        type: Map,
        of: {
            total: Number,
            correct: Number,
            percentage: Number
        }
    },
    timeStarted: {
        type: Date,
        required: true
    },
    timeCompleted: {
        type: Date,
        required: true,
        default: Date.now
    },
    durationMinutes: {
        type: Number,
        required: true
    },
    isRetake: {
        type: Boolean,
        default: false
    },
    originalQuizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizResult',
        default: null
    },
    metadata: {
        deviceType: String,
        browserInfo: String,
        ipAddress: String
    }
}, {
    timestamps: true
});

// Index for efficient queries
QuizResultSchema.index({ userId: 1, createdAt: -1 });
QuizResultSchema.index({ userId: 1, score: -1 });
QuizResultSchema.index({ userId: 1, percentage: -1 });

// Virtual for getting improvement from original attempt
QuizResultSchema.virtual('improvement').get(function() {
    if (this.originalQuizId && this.originalScore !== undefined) {
        return this.score - this.originalScore;
    }
    return 0;
});

// Virtual for attempt number (calculate based on user's quiz history)
QuizResultSchema.virtual('attemptNumber');

// Method to get competency strengths and weaknesses
QuizResultSchema.methods.getCompetencyInsights = function() {
    const analysis = this.competencyAnalysis;
    if (!analysis || analysis.size === 0) return null;

    const competencies = Array.from(analysis.entries()).map(([name, stats]) => ({
        name,
        ...stats
    }));

    const strengths = competencies.filter(comp => comp.percentage >= 80);
    const weaknesses = competencies.filter(comp => comp.percentage < 60);
    const average = competencies.reduce((sum, comp) => sum + comp.percentage, 0) / competencies.length;

    return {
        strengths: strengths.map(s => s.name),
        weaknesses: weaknesses.map(w => w.name),
        averageCompetencyScore: Math.round(average),
        allCompetencies: competencies.sort((a, b) => b.percentage - a.percentage)
    };
};

// Method to compare with previous attempts
QuizResultSchema.methods.compareWithPrevious = function(previousAttempts = []) {
    if (previousAttempts.length === 0) {
        return {
            isFirstAttempt: true,
            improvement: 0,
            bestScore: this.score,
            averageScore: this.score,
            trend: 'neutral'
        };
    }

    const scores = previousAttempts.map(attempt => attempt.score);
    const previousBest = Math.max(...scores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const lastScore = scores[scores.length - 1] || 0;
    
    let trend = 'neutral';
    if (this.score > lastScore) trend = 'improving';
    else if (this.score < lastScore) trend = 'declining';

    return {
        isFirstAttempt: false,
        improvement: this.score - lastScore,
        improvementFromBest: this.score - previousBest,
        bestScore: Math.max(this.score, previousBest),
        averageScore: Math.round((averageScore * previousAttempts.length + this.score) / (previousAttempts.length + 1)),
        previousAttempts: previousAttempts.length,
        trend,
        isNewPersonalBest: this.score > previousBest
    };
};

// Static method to get user's quiz statistics
QuizResultSchema.statics.getUserStats = async function(userId) {
    const results = await this.find({ userId }).sort({ createdAt: -1 });
    
    if (results.length === 0) {
        return {
            totalAttempts: 0,
            bestScore: 0,
            averageScore: 0,
            latestScore: 0,
            improvement: 0,
            competencyInsights: null
        };
    }

    const scores = results.map(r => r.score);
    const bestScore = Math.max(...scores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const latestScore = scores[0];
    const firstScore = scores[scores.length - 1];
    const improvement = latestScore - firstScore;

    // Get latest competency analysis
    const latestResult = results[0];
    const competencyInsights = latestResult.getCompetencyInsights();

    return {
        totalAttempts: results.length,
        bestScore,
        averageScore: Math.round(averageScore),
        latestScore,
        improvement,
        competencyInsights,
        allAttempts: results.map(r => ({
            id: r._id,
            score: r.score,
            percentage: r.percentage,
            date: r.createdAt,
            durationMinutes: r.durationMinutes
        }))
    };
};

module.exports = mongoose.model('QuizResult', QuizResultSchema);