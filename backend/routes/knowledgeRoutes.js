// Knowledge Management API Routes
// RESTful API for dynamic CNA knowledge documents

const express = require('express');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const EmbeddingService = require('../services/embeddingService');
const router = express.Router();

// Initialize embedding service (will be set up when first used)
let embeddingService = null;

const initializeEmbeddingService = () => {
  if (!embeddingService && process.env.GOOGLE_API_KEY) {
    embeddingService = new EmbeddingService(process.env.GOOGLE_API_KEY);
  }
  return embeddingService;
};

// GET /api/knowledge/documents - Get all documents
router.get('/documents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      skillId,
      category,
      status = 'published',
      isActive = true,
      page = 1,
      limit = 50,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (skillId && skillId !== 'all') query.skillId = skillId;
    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const documents = await KnowledgeDocument.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await KnowledgeDocument.countDocuments(query);

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge documents' });
  }
});

// GET /api/knowledge/documents/skill/:skillId - Get documents by skill
router.get('/documents/skill/:skillId', authenticateToken, async (req, res) => {
  try {
    const { skillId } = req.params;
    const documents = await KnowledgeDocument.findBySkill(skillId, true);
    
    res.json(documents);
  } catch (error) {
    console.error(`Error fetching documents for skill ${req.params.skillId}:`, error);
    res.status(500).json({ error: 'Failed to fetch skill documents' });
  }
});

// GET /api/knowledge/documents/search - Search documents
router.get('/documents/search', authenticateToken, async (req, res) => {
  try {
    const { q, skillId, category, criticality, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Build search query
    const searchQuery = {
      $text: { $search: q },
      isActive: true,
      status: 'published'
    };

    if (skillId && skillId !== 'all') searchQuery.skillId = skillId;
    if (category && category !== 'all') searchQuery.category = category;
    if (criticality && criticality !== 'all') searchQuery.criticality = criticality;

    const skip = (page - 1) * limit;

    const documents = await KnowledgeDocument.find(
      searchQuery,
      { score: { $meta: 'textScore' } }
    )
      .populate('createdBy', 'name email')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await KnowledgeDocument.countDocuments(searchQuery);

    res.json({
      documents,
      query: q,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({ error: 'Failed to search knowledge documents' });
  }
});

// GET /api/knowledge/documents/:id - Get single document
router.get('/documents/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const document = await KnowledgeDocument.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error(`Error fetching document ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST /api/knowledge/documents - Create new document
router.post('/documents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const documentData = {
      ...req.body,
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
      changeHistory: [{
        version: 1,
        changedBy: req.user.userId,
        changeType: 'created',
        changeDescription: 'Document created'
      }]
    };

    const document = new KnowledgeDocument(documentData);
    await document.save();

    // Populate references
    await document.populate('createdBy', 'name email');

    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Document ID already exists' });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// PUT /api/knowledge/documents/:id - Update document
router.put('/documents/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const document = await KnowledgeDocument.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
        document[key] = req.body[key];
      }
    });

    document.updatedBy = req.user.userId;
    
    await document.save();
    
    // Populate references
    await document.populate('createdBy', 'name email');
    await document.populate('updatedBy', 'name email');

    res.json(document);
  } catch (error) {
    console.error(`Error updating document ${req.params.id}:`, error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE /api/knowledge/documents/:id - Delete document
router.delete('/documents/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const document = await KnowledgeDocument.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await document.deleteOne();
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error(`Error deleting document ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// POST /api/knowledge/documents/:id/embeddings - Update embedding status
router.post('/documents/:id/embeddings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { embeddingIds, status } = req.body;
    
    const document = await KnowledgeDocument.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (status === 'completed' && embeddingIds) {
      await document.markEmbeddingComplete(embeddingIds);
    } else if (status === 'failed') {
      await document.markEmbeddingFailed();
    } else {
      document.embeddingStatus = status;
      await document.save();
    }

    res.json({ message: 'Embedding status updated', status: document.embeddingStatus });
  } catch (error) {
    console.error(`Error updating embedding status for document ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update embedding status' });
  }
});

// GET /api/knowledge/stats - Get system statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await KnowledgeDocument.getStats();
    
    // Add additional stats
    const lastUpdated = await KnowledgeDocument.findOne()
      .sort({ updatedAt: -1 })
      .select('updatedAt');
    
    const pendingEmbeddings = await KnowledgeDocument.countDocuments({
      embeddingStatus: 'pending',
      isActive: true,
      status: 'published'
    });

    const failedEmbeddings = await KnowledgeDocument.countDocuments({
      embeddingStatus: 'failed',
      isActive: true,
      status: 'published'
    });

    res.json({
      ...stats,
      lastUpdated: lastUpdated?.updatedAt || null,
      embeddingStatus: pendingEmbeddings > 0 ? 'pending' : 
                     failedEmbeddings > 0 ? 'failed' : 'idle'
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get system statistics' });
  }
});

// POST /api/knowledge/embeddings/refresh - Refresh all embeddings
router.post('/embeddings/refresh', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mark all active documents for re-embedding
    await KnowledgeDocument.updateMany(
      { isActive: true, status: 'published' },
      { embeddingStatus: 'pending', lastEmbeddingUpdate: new Date() }
    );

    const count = await KnowledgeDocument.countDocuments({
      embeddingStatus: 'pending',
      isActive: true,
      status: 'published'
    });

    res.json({ 
      message: 'Embedding refresh initiated', 
      documentsMarked: count 
    });
  } catch (error) {
    console.error('Error refreshing embeddings:', error);
    res.status(500).json({ error: 'Failed to refresh embeddings' });
  }
});

// POST /api/knowledge/documents/import - Import documents
router.post('/documents/import', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { documents } = req.body;
    
    if (!Array.isArray(documents)) {
      return res.status(400).json({ error: 'Documents must be an array' });
    }

    const results = { successful: 0, failed: 0, errors: [] };
    
    for (const docData of documents) {
      try {
        const document = new KnowledgeDocument({
          ...docData,
          createdBy: req.user.userId,
          updatedBy: req.user.userId,
          changeHistory: [{
            version: 1,
            changedBy: req.user.userId,
            changeType: 'created',
            changeDescription: 'Document imported'
          }]
        });
        
        await document.save();
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          document: docData.title || 'Unknown',
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error importing documents:', error);
    res.status(500).json({ error: 'Failed to import documents' });
  }
});

// GET /api/knowledge/documents/export - Export all documents
router.get('/documents/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const documents = await KnowledgeDocument.find({ isActive: true })
      .select('-changeHistory -usage -embeddingIds -createdBy -updatedBy -reviewedBy')
      .lean();

    res.json(documents);
  } catch (error) {
    console.error('Error exporting documents:', error);
    res.status(500).json({ error: 'Failed to export documents' });
  }
});

module.exports = router;