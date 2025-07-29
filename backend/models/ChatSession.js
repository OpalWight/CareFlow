// backend/models/ChatSession.js
const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scenarioId: { type: String, required: true },
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
      evidence: { type: String }
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
