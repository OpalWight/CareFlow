// backend/models/ChatSession.js
const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scenarioId: { type: String, required: true },
  evaluationMode: { type: String, enum: ['broad', 'specific'], default: 'broad' },
  currentStepIndex: { type: Number, default: 0 }, // For tracking ordered step progression
  messages: [
    {
      role: { type: String, enum: ['user', 'model'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  completedObjectives: [
    {
      objective: { type: String, required: true },
      completedAt: { type: Date, default: Date.now },
      evidence: { type: String },
      stepIndex: { type: Number } // For tracking step order in specific mode
    }
  ],
  messageEvaluations: [
    {
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      isRelevant: { type: Boolean, required: true },
      relevanceReason: { type: String },
      objectivesAddressed: [{ type: String }]
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ChatSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
