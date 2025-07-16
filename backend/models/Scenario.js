const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
  skillId: {
    type: String,
    required: true,
    unique: true
  },
  skillName: {
    type: String,
    required: true
  },
  skillCategory: {
    type: String,
    required: true,
    enum: ['infection-control', 'adl', 'mobility', 'measurement', 'range-motion']
  },
  patientName: {
    type: String,
    required: true
  },
  patientAge: {
    type: Number,
    required: true
  },
  patientCondition: {
    type: String,
    required: true
  },
  patientPersonality: {
    type: String,
    required: true
  },
  specificSymptoms: {
    type: String,
    required: true
  },
  scenarioContext: {
    type: String,
    required: true
  },
  learningObjectives: [{
    type: String
  }],
  criticalSteps: [{
    stepNumber: Number,
    description: String,
    critical: Boolean
  }],
  commonMistakes: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
scenarioSchema.index({ skillCategory: 1, isActive: 1 });

module.exports = mongoose.model('Scenario', scenarioSchema);