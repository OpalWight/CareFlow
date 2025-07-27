const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillId: {
    type: String,
    required: true,
    // References the keys from cnaSkillScenarios.js (e.g., 'hand-hygiene', 'elastic-stocking')
  },
  // Patient simulation progress
  patientSimProgress: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedSteps: [{
      stepId: String,
      completedAt: {
        type: Date,
        default: Date.now
      }
    }],
    totalSteps: {
      type: Number,
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastAttemptAt: Date,
    bestScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  // Chat simulation progress
  chatSimProgress: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    sessionsCompleted: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 1 // Most skills have 1 chat session, but this allows flexibility
    },
    averageRating: {
      type: Number,
      validate: {
        validator: function(v) {
          return v === undefined || v === null || (v >= 1 && v <= 5);
        },
        message: 'Rating must be between 1 and 5 when provided'
      }
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    lastSessionAt: Date,
    chatSessions: [{
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatSession'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      duration: Number // in seconds
    }]
  },
  // Overall skill progress
  overallProgress: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    firstStartedAt: {
      type: Date,
      default: Date.now
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    },
    totalTimeSpent: {
      type: Number, // in seconds
      default: 0
    }
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
userProgressSchema.index({ userId: 1, skillId: 1 }, { unique: true });

// Virtual for calculating overall completion percentage
userProgressSchema.virtual('calculatedCompletionPercentage').get(function() {
  const patientSimWeight = 0.7; // 70% weight for patient simulation
  const chatSimWeight = 0.3;    // 30% weight for chat simulation
  
  const patientSimPercentage = this.patientSimProgress.isCompleted ? 100 : 
    (this.patientSimProgress.completedSteps.length / this.patientSimProgress.totalSteps) * 100;
  
  const chatSimPercentage = this.chatSimProgress.isCompleted ? 100 :
    (this.chatSimProgress.sessionsCompleted / this.chatSimProgress.totalSessions) * 100;
  
  return Math.round((patientSimPercentage * patientSimWeight) + (chatSimPercentage * chatSimWeight));
});

// Method to update overall progress
userProgressSchema.methods.updateOverallProgress = function() {
  const calculatedPercentage = this.calculatedCompletionPercentage;
  this.overallProgress.completionPercentage = calculatedPercentage;
  this.overallProgress.isCompleted = calculatedPercentage === 100;
  this.overallProgress.lastUpdatedAt = new Date();
  this.overallProgress.totalTimeSpent = this.patientSimProgress.timeSpent + this.chatSimProgress.timeSpent;
  return this.save();
};

// Method to update patient simulation progress
userProgressSchema.methods.updatePatientSimProgress = function(completedSteps, score, timeSpent) {
  this.patientSimProgress.completedSteps = completedSteps;
  this.patientSimProgress.score = score;
  this.patientSimProgress.timeSpent += timeSpent;
  this.patientSimProgress.attempts += 1;
  this.patientSimProgress.lastAttemptAt = new Date();
  
  if (score > this.patientSimProgress.bestScore) {
    this.patientSimProgress.bestScore = score;
  }
  
  this.patientSimProgress.isCompleted = completedSteps.length === this.patientSimProgress.totalSteps;
  
  return this.updateOverallProgress();
};

// Method to update chat simulation progress
userProgressSchema.methods.updateChatSimProgress = function(sessionId, rating, duration) {
  // Add new chat session
  this.chatSimProgress.chatSessions.push({
    sessionId,
    rating,
    completedAt: new Date(),
    duration
  });
  
  this.chatSimProgress.sessionsCompleted += 1;
  this.chatSimProgress.timeSpent += duration;
  this.chatSimProgress.lastSessionAt = new Date();
  
  // Calculate average rating only if there are sessions with ratings
  if (this.chatSimProgress.chatSessions.length > 0) {
    const totalRating = this.chatSimProgress.chatSessions.reduce((sum, session) => sum + session.rating, 0);
    this.chatSimProgress.averageRating = totalRating / this.chatSimProgress.chatSessions.length;
  }
  
  this.chatSimProgress.isCompleted = this.chatSimProgress.sessionsCompleted >= this.chatSimProgress.totalSessions;
  
  return this.updateOverallProgress();
};

// Static method to get user's overall progress summary
userProgressSchema.statics.getUserProgressSummary = async function(userId) {
  const progressRecords = await this.find({ userId }).populate('userId', 'name email');
  
  const summary = {
    totalSkills: progressRecords.length,
    completedSkills: progressRecords.filter(p => p.overallProgress.isCompleted).length,
    inProgressSkills: progressRecords.filter(p => p.overallProgress.completionPercentage > 0 && !p.overallProgress.isCompleted).length,
    totalTimeSpent: progressRecords.reduce((sum, p) => sum + p.overallProgress.totalTimeSpent, 0),
    averageCompletionPercentage: progressRecords.length > 0 ? 
      Math.round(progressRecords.reduce((sum, p) => sum + p.overallProgress.completionPercentage, 0) / progressRecords.length) : 0,
    skillsProgress: progressRecords.map(progress => ({
      skillId: progress.skillId,
      completionPercentage: progress.overallProgress.completionPercentage,
      isCompleted: progress.overallProgress.isCompleted,
      lastUpdated: progress.overallProgress.lastUpdatedAt,
      patientSimCompleted: progress.patientSimProgress.isCompleted,
      chatSimCompleted: progress.chatSimProgress.isCompleted
    }))
  };
  
  return summary;
};

module.exports = mongoose.model('UserProgress', userProgressSchema);