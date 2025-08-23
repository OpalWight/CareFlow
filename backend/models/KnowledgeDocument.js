// Knowledge Document Database Schema
// Mongoose schema for dynamic CNA knowledge documents

const mongoose = require('mongoose');

const knowledgeDocumentSchema = new mongoose.Schema({
  // Basic Document Information
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  content: {
    type: String,
    required: true,
    maxlength: 10000 // Reasonable limit for knowledge documents
  },
  
  // Classification
  skillId: {
    type: String,
    required: true,
    index: true,
    enum: [
      'hand-hygiene',
      'elastic-stocking', 
      'ambulate-transfer-belt',
      'bedpan-use',
      'denture-cleaning',
      'radial-pulse',
      'respirations',
      'ppe-gown-gloves',
      'dressing-affected-arm',
      'feeding-client',
      'modified-bed-bath',
      'electronic-blood-pressure',
      'urinary-output',
      'weight-measurement',
      'prom-knee-ankle',
      'prom-shoulder',
      'position-on-side',
      'catheter-care-female',
      'foot-care',
      'mouth-care',
      'perineal-care-female',
      'transfer-bed-wheelchair',
      'manual-blood-pressure',
      'general' // For cross-skill knowledge
    ]
  },
  
  category: {
    type: String,
    required: true,
    enum: [
      'infection-control',
      'adl-assistance', 
      'mobility-safety',
      'assessment',
      'professionalism',
      'safety',
      'technique',
      'regulations'
    ]
  },
  
  // Metadata
  source: {
    type: String,
    required: true,
    enum: [
      'credentia-2024',
      'obra-regulations',
      'safety-guidelines',
      'professional-guidelines',
      'assessment-data',
      'custom',
      'user-generated'
    ]
  },
  
  criticality: {
    type: String,
    required: true,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Versioning and Status
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Embedding Information
  embeddingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  embeddingIds: [{
    chunkId: String,
    vectorId: String,
    chunkIndex: Number
  }],
  
  lastEmbeddingUpdate: {
    type: Date,
    default: null
  },
  
  // Quality and Review
  reviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs-revision'],
    default: 'pending'
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  reviewedAt: {
    type: Date,
    default: null
  },
  
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  
  // Usage Analytics
  usage: {
    retrievalCount: {
      type: Number,
      default: 0
    },
    lastRetrieved: {
      type: Date,
      default: null
    },
    averageRelevanceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    feedbackCount: {
      positive: { type: Number, default: 0 },
      negative: { type: Number, default: 0 }
    }
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Change History
  changeHistory: [{
    version: Number,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changeType: {
      type: String,
      enum: ['created', 'content-updated', 'metadata-updated', 'status-changed', 'archived']
    },
    changeDescription: String,
    previousValues: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  collection: 'knowledge_documents'
});

// Indexes for performance
knowledgeDocumentSchema.index({ skillId: 1, category: 1 });
knowledgeDocumentSchema.index({ status: 1, isActive: 1 });
knowledgeDocumentSchema.index({ embeddingStatus: 1 });
knowledgeDocumentSchema.index({ tags: 1 });
knowledgeDocumentSchema.index({ createdAt: -1 });
knowledgeDocumentSchema.index({ 'usage.retrievalCount': -1 });

// Text search index
knowledgeDocumentSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    content: 5,
    tags: 1
  }
});

// Virtual for URL-friendly ID
knowledgeDocumentSchema.virtual('slug').get(function() {
  return this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
});

// Pre-save middleware to update version and change history
knowledgeDocumentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    // Increment version for content changes
    if (this.isModified('content') || this.isModified('title')) {
      this.version += 1;
      this.embeddingStatus = 'pending'; // Mark for re-embedding
    }
    
    // Add to change history
    const changeType = this.isModified('content') || this.isModified('title') 
      ? 'content-updated' 
      : 'metadata-updated';
    
    this.changeHistory.push({
      version: this.version,
      changedBy: this.updatedBy,
      changeType: changeType,
      changeDescription: `Document updated`,
      previousValues: this.getModifiedPaths().reduce((acc, path) => {
        acc[path] = this.$__.originalValue || this[path];
        return acc;
      }, {})
    });
  }
  
  next();
});

// Static methods
knowledgeDocumentSchema.statics.findBySkill = function(skillId, onlyActive = true) {
  const query = { skillId };
  if (onlyActive) {
    query.isActive = true;
    query.status = 'published';
  }
  return this.find(query).sort({ createdAt: -1 });
};

knowledgeDocumentSchema.statics.findByCategory = function(category, onlyActive = true) {
  const query = { category };
  if (onlyActive) {
    query.isActive = true;
    query.status = 'published';
  }
  return this.find(query).sort({ createdAt: -1 });
};

knowledgeDocumentSchema.statics.findPendingEmbeddings = function() {
  return this.find({ 
    embeddingStatus: { $in: ['pending', 'failed'] },
    isActive: true,
    status: 'published'
  });
};

knowledgeDocumentSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        pendingEmbedding: { $sum: { $cond: [{ $eq: ['$embeddingStatus', 'pending'] }, 1, 0] } },
        avgQualityScore: { $avg: '$qualityScore' }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    active: 0,
    published: 0,
    pendingEmbedding: 0,
    avgQualityScore: null
  };
};

// Instance methods
knowledgeDocumentSchema.methods.incrementRetrieval = function(relevanceScore = null) {
  this.usage.retrievalCount += 1;
  this.usage.lastRetrieved = new Date();
  
  if (relevanceScore !== null) {
    const currentAvg = this.usage.averageRelevanceScore || 0;
    const count = this.usage.retrievalCount;
    this.usage.averageRelevanceScore = ((currentAvg * (count - 1)) + relevanceScore) / count;
  }
  
  return this.save();
};

knowledgeDocumentSchema.methods.addFeedback = function(isPositive) {
  if (isPositive) {
    this.usage.feedbackCount.positive += 1;
  } else {
    this.usage.feedbackCount.negative += 1;
  }
  
  return this.save();
};

knowledgeDocumentSchema.methods.markEmbeddingComplete = function(embeddingIds) {
  this.embeddingStatus = 'completed';
  this.embeddingIds = embeddingIds;
  this.lastEmbeddingUpdate = new Date();
  
  return this.save();
};

knowledgeDocumentSchema.methods.markEmbeddingFailed = function() {
  this.embeddingStatus = 'failed';
  
  return this.save();
};

module.exports = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);