const express = require('express');
const router = express.Router();
const RAGVerificationService = require('../services/ragVerificationService');
const EmbeddingService = require('../services/embeddingService');
const KnowledgeBase = require('../services/knowledgeBase');

// Initialize RAG service instance
let ragService = null;

// Initialize RAG service
const initializeRAGService = async () => {
  if (!ragService) {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    
    if (!googleApiKey || !pineconeApiKey) {
      throw new Error('Missing required API keys for RAG service');
    }
    
    ragService = new RAGVerificationService(googleApiKey, pineconeApiKey);
    await ragService.initialize();
  }
  return ragService;
};

// Middleware to ensure RAG service is initialized
const ensureRAGInitialized = async (req, res, next) => {
  try {
    await initializeRAGService();
    next();
  } catch (error) {
    console.error('Error initializing RAG service:', error);
    res.status(500).json({ 
      error: 'RAG service initialization failed',
      details: error.message 
    });
  }
};

/**
 * POST /api/rag/verify-step
 * Verify a skill step using RAG
 */
router.post('/verify-step', ensureRAGInitialized, async (req, res) => {
  try {
    const stepData = req.body;
    
    // Validate required fields
    const requiredFields = ['skillId', 'stepId', 'stepName', 'userAction'];
    const missingFields = requiredFields.filter(field => !stepData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }
    
    // Verify the step using RAG
    const verification = await ragService.verifySkillStep(stepData);
    
    res.json({
      success: true,
      verification
    });
    
  } catch (error) {
    console.error('Error in RAG step verification:', error);
    res.status(500).json({
      error: 'Step verification failed',
      details: error.message
    });
  }
});

/**
 * POST /api/rag/embed-documents
 * Create embeddings for documents and store in knowledge base
 */
router.post('/embed-documents', ensureRAGInitialized, async (req, res) => {
  try {
    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        error: 'Documents array is required'
      });
    }
    
    // Create embeddings
    const embeddingService = new EmbeddingService(process.env.GOOGLE_API_KEY);
    const embeddings = await embeddingService.createEmbeddings(documents);
    
    // Store in knowledge base
    const knowledgeBase = new KnowledgeBase(process.env.PINECONE_API_KEY);
    await knowledgeBase.initialize();
    await knowledgeBase.addDocuments(embeddings);
    
    res.json({
      success: true,
      embeddingsCreated: embeddings.length,
      documentsProcessed: documents.length
    });
    
  } catch (error) {
    console.error('Error embedding documents:', error);
    res.status(500).json({
      error: 'Document embedding failed',
      details: error.message
    });
  }
});

/**
 * GET /api/rag/knowledge-stats
 * Get knowledge base statistics
 */
router.get('/knowledge-stats', ensureRAGInitialized, async (req, res) => {
  try {
    const stats = await ragService.getKnowledgeBaseStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting knowledge stats:', error);
    res.status(500).json({
      error: 'Failed to get knowledge base statistics',
      details: error.message
    });
  }
});

/**
 * POST /api/rag/search-knowledge
 * Search knowledge base for relevant information
 */
router.post('/search-knowledge', ensureRAGInitialized, async (req, res) => {
  try {
    const { query, skillId, options = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }
    
    // Create query embedding
    const embeddingService = new EmbeddingService(process.env.GOOGLE_API_KEY);
    const queryEmbedding = await embeddingService.createQueryEmbedding(query);
    
    // Search knowledge base
    const knowledgeBase = new KnowledgeBase(process.env.PINECONE_API_KEY);
    await knowledgeBase.initialize();
    
    const searchOptions = {
      skillId,
      topK: options.topK || 5,
      minScore: options.minScore || 0.7,
      ...options
    };
    
    const results = await knowledgeBase.query(queryEmbedding, searchOptions);
    
    res.json({
      success: true,
      query,
      results: results.matches.map(match => ({
        id: match.id,
        content: match.metadata.content,
        score: match.score,
        skillId: match.metadata.skillId,
        source: match.metadata.source,
        criticality: match.metadata.criticality,
        tags: match.metadata.tags
      })),
      totalResults: results.matches.length
    });
    
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    res.status(500).json({
      error: 'Knowledge search failed',
      details: error.message
    });
  }
});

/**
 * DELETE /api/rag/knowledge/:skillId
 * Delete knowledge for a specific skill
 */
router.delete('/knowledge/:skillId', ensureRAGInitialized, async (req, res) => {
  try {
    const { skillId } = req.params;
    
    const knowledgeBase = new KnowledgeBase(process.env.PINECONE_API_KEY);
    await knowledgeBase.initialize();
    await knowledgeBase.deleteBySkillId(skillId);
    
    res.json({
      success: true,
      message: `Knowledge for skill ${skillId} deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    res.status(500).json({
      error: 'Knowledge deletion failed',
      details: error.message
    });
  }
});

/**
 * GET /api/rag/health
 * Health check for RAG service
 */
router.get('/health', async (req, res) => {
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    
    const status = {
      ragService: !!ragService,
      googleApiKey: !!googleApiKey,
      pineconeApiKey: !!pineconeApiKey,
      initialized: ragService ? ragService.initialized : false
    };
    
    if (!status.googleApiKey || !status.pineconeApiKey) {
      return res.status(500).json({
        success: false,
        status,
        error: 'Missing required API keys'
      });
    }
    
    res.json({
      success: true,
      status,
      message: 'RAG service is healthy'
    });
    
  } catch (error) {
    console.error('RAG health check error:', error);
    res.status(500).json({
      success: false,
      error: 'RAG health check failed',
      details: error.message
    });
  }
});

module.exports = router;