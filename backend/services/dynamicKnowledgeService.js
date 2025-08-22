// Dynamic Knowledge Management Service
// Handles CRUD operations for dynamic knowledge documents with automatic re-embedding

const EmbeddingService = require('./embeddingService');
const KnowledgeBase = require('./knowledgeBase');
const KnowledgeDocument = require('../models/KnowledgeDocument');

class DynamicKnowledgeService {
  constructor() {
    this.embeddingService = null;
    this.knowledgeBase = null;
    this.initialized = false;
  }

  /**
   * Initialize the service with embedding and knowledge base
   */
  async initialize() {
    try {
      const googleApiKey = process.env.GOOGLE_API_KEY;
      const pineconeApiKey = process.env.PINECONE_API_KEY;

      if (!googleApiKey || !pineconeApiKey) {
        throw new Error('API keys not configured for dynamic knowledge service');
      }

      this.embeddingService = new EmbeddingService(googleApiKey);
      this.knowledgeBase = new KnowledgeBase(pineconeApiKey);
      await this.knowledgeBase.initialize();

      this.initialized = true;
      console.log('Dynamic Knowledge Service initialized');
    } catch (error) {
      console.error('Error initializing Dynamic Knowledge Service:', error);
      throw error;
    }
  }

  /**
   * Get all knowledge documents
   * @param {Object} filters - Optional filters
   * @returns {Array} Knowledge documents
   */
  async getAllDocuments(filters = {}) {
    try {
      const query = { ...filters };
      const documents = await KnowledgeDocument.find(query).sort({ createdAt: -1 });
      return documents;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch knowledge documents');
    }
  }

  /**
   * Get documents by skill ID
   * @param {string} skillId - Skill identifier
   * @returns {Array} Knowledge documents for the skill
   */
  async getDocumentsBySkill(skillId) {
    try {
      const documents = await KnowledgeDocument.find({ 
        skillId: skillId,
        isActive: true,
        status: 'published'
      });
      return documents;
    } catch (error) {
      console.error(`Error fetching documents for skill ${skillId}:`, error);
      throw new Error(`Failed to fetch documents for skill ${skillId}`);
    }
  }

  /**
   * Get a single document by ID
   * @param {string} documentId - Document ID
   * @returns {Object} Knowledge document
   */
  async getDocument(documentId) {
    try {
      const document = await KnowledgeDocument.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      return document;
    } catch (error) {
      console.error(`Error fetching document ${documentId}:`, error);
      throw new Error(`Failed to fetch document ${documentId}`);
    }
  }

  /**
   * Create a new knowledge document
   * @param {Object} documentData - Document data
   * @returns {Object} Created document
   */
  async createDocument(documentData) {
    try {
      // Validate required fields
      this.validateDocumentData(documentData);
      
      // Create document in database
      const document = new KnowledgeDocument(documentData);
      await document.save();

      // Automatically create embeddings for the new document
      await this.createEmbeddingsForDocument(document);

      return document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create knowledge document');
    }
  }

  /**
   * Update an existing knowledge document
   * @param {string} documentId - Document ID
   * @param {Object} updateData - Updated data
   * @returns {Object} Updated document
   */
  async updateDocument(documentId, updateData) {
    try {
      // Validate update data
      this.validateDocumentData(updateData, false);
      
      // Get current document for comparison
      const currentDoc = await this.getDocument(documentId);
      
      // Update document in database
      const updatedDocument = await KnowledgeDocument.findByIdAndUpdate(
        documentId,
        { ...updateData, lastModified: new Date() },
        { new: true, runValidators: true }
      );

      // Re-create embeddings if content changed
      const contentChanged = currentDoc.content !== updateData.content || 
                           currentDoc.title !== updateData.title;
      
      if (contentChanged) {
        await this.updateEmbeddingsForDocument(updatedDocument, currentDoc);
      }

      return updatedDocument;
    } catch (error) {
      console.error(`Error updating document ${documentId}:`, error);
      throw new Error('Failed to update knowledge document');
    }
  }

  /**
   * Delete a knowledge document
   * @param {string} documentId - Document ID
   */
  async deleteDocument(documentId) {
    try {
      // Get document to find its embeddings
      const document = await this.getDocument(documentId);
      
      // Delete embeddings from vector database
      if (document.embeddingIds && document.embeddingIds.length > 0) {
        await this.deleteEmbeddingsForDocument(document);
      }

      // Delete document from database
      await KnowledgeDocument.findByIdAndDelete(documentId);
      
      console.log(`Document ${documentId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw new Error('Failed to delete knowledge document');
    }
  }

  /**
   * Search documents with text search
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Matching documents
   */
  async searchDocuments(query, filters = {}) {
    try {
      const searchQuery = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ],
        ...filters
      };
      
      const documents = await KnowledgeDocument.find(searchQuery)
        .sort({ lastModified: -1 })
        .limit(20);
        
      return documents;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error('Failed to search knowledge documents');
    }
  }

  /**
   * Get knowledge for RAG from vector database only
   * @param {string} queryText - Query text
   * @param {string} skillId - Skill ID
   * @param {Object} options - Search options
   * @returns {Object} Knowledge documents from RAG system
   */
  async getCombinedKnowledge(queryText, skillId, options = {}) {
    if (!this.initialized || !this.knowledgeBase) {
      throw new Error('Knowledge base not initialized');
    }

    try {
      // Search vector database for relevant knowledge
      const searchResults = await this.knowledgeBase.search(
        queryText,
        (text) => this.embeddingService.createQueryEmbedding(text),
        {
          skillId: skillId,
          topK: options.topK || 5,
          minScore: options.minScore || 0.7
        }
      );
      
      // Format results
      const documents = searchResults.documents.map(doc => ({
        ...doc,
        source_type: 'dynamic',
        priority: 1
      }));
      
      console.log(`Found ${documents.length} knowledge documents from RAG system`);
      
      return {
        documents,
        totalResults: documents.length,
        hasDynamicContent: documents.length > 0,
        hasStaticFallback: false
      };
    } catch (error) {
      console.error('Error retrieving knowledge from RAG system:', error);
      
      // Return empty results if RAG fails
      return {
        documents: [],
        totalResults: 0,
        hasDynamicContent: false,
        hasStaticFallback: false,
        error: error.message
      };
    }
  }


  /**
   * Create embeddings for a new document
   * @param {Object} document - Document object
   */
  async createEmbeddingsForDocument(document) {
    if (!this.initialized) return;
    
    try {
      console.log(`Creating embeddings for document ${document.id}`);
      
      // Mark embedding as processing
      await KnowledgeDocument.findByIdAndUpdate(document._id, {
        embeddingStatus: 'processing'
      });
      
      // Create embeddings
      const embeddings = await this.embeddingService.createEmbeddings([{
        id: document.id,
        skillId: document.skillId,
        content: document.content,
        source: document.source,
        criticality: document.criticality,
        tags: document.tags
      }]);
      
      // Store in vector database with dynamic source marker
      const vectorEmbeddings = embeddings.map(emb => ({
        ...emb,
        metadata: {
          ...emb.metadata,
          source_type: 'dynamic',
          document_id: document._id.toString(),
          created_at: new Date().toISOString()
        }
      }));
      
      await this.knowledgeBase.addDocuments(vectorEmbeddings);
      
      // Update document with embedding IDs and status
      const embeddingIds = embeddings.map((emb, index) => ({
        chunkId: emb.id,
        vectorId: emb.id,
        chunkIndex: index
      }));
      
      await KnowledgeDocument.findByIdAndUpdate(document._id, {
        embeddingIds,
        embeddingStatus: 'completed',
        lastEmbedded: new Date()
      });
      
      console.log(`Successfully created ${embeddings.length} embeddings for document ${document.id}`);
    } catch (error) {
      console.error(`Error creating embeddings for document ${document.id}:`, error);
      
      // Mark embedding as failed
      try {
        await KnowledgeDocument.findByIdAndUpdate(document._id, {
          embeddingStatus: 'failed'
        });
      } catch (updateError) {
        console.error('Failed to update embedding status:', updateError);
      }
      
      throw error;
    }
  }

  /**
   * Update embeddings for a modified document
   * @param {Object} updatedDocument - Updated document
   * @param {Object} previousDocument - Previous version of document
   */
  async updateEmbeddingsForDocument(updatedDocument, previousDocument) {
    if (!this.initialized) return;
    
    try {
      console.log(`Updating embeddings for document ${updatedDocument.id}`);
      
      // Delete old embeddings
      await this.deleteEmbeddingsForDocument(previousDocument);
      
      // Create new embeddings
      await this.createEmbeddingsForDocument(updatedDocument);
      
      console.log(`Successfully updated embeddings for document ${updatedDocument.id}`);
    } catch (error) {
      console.error(`Error updating embeddings for document ${updatedDocument.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete embeddings for a document
   * @param {Object} document - Document object
   */
  async deleteEmbeddingsForDocument(document) {
    if (!this.initialized || !document.embeddingIds) return;
    
    try {
      // Delete from vector database by document ID filter
      const documentId = document._id.toString();
      await this.knowledgeBase.index.deleteMany({
        filter: { document_id: { $eq: documentId } }
      });
      
      console.log(`Deleted embeddings for document ${document.id}`);
    } catch (error) {
      console.error(`Error deleting embeddings for document ${document.id}:`, error);
      throw error;
    }
  }

  /**
   * Get system statistics
   * @returns {Object} System stats
   */
  async getStats() {
    try {
      const totalDocuments = await KnowledgeDocument.countDocuments();
      const publishedDocuments = await KnowledgeDocument.countDocuments({ status: 'published', isActive: true });
      const embeddingStats = await KnowledgeDocument.aggregate([
        {
          $group: {
            _id: '$embeddingStatus',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const lastUpdated = await KnowledgeDocument.findOne()
        .sort({ lastModified: -1 })
        .select('lastModified');
      
      return {
        totalDocuments,
        publishedDocuments,
        embeddingStats: embeddingStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        lastUpdated: lastUpdated?.lastModified || null
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalDocuments: 0,
        publishedDocuments: 0,
        embeddingStats: {},
        lastUpdated: null
      };
    }
  }

  /**
   * Validate document data
   * @param {Object} data - Document data
   * @param {boolean} requireId - Whether ID is required
   */
  validateDocumentData(data, requireId = true) {
    const required = ['title', 'content', 'skillId', 'category', 'source', 'criticality'];
    if (requireId) required.push('id');
    
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (data.content && data.content.length > 10000) {
      throw new Error('Content exceeds maximum length of 10,000 characters');
    }
    
    if (data.title && data.title.length > 200) {
      throw new Error('Title exceeds maximum length of 200 characters');
    }
  }
}

module.exports = DynamicKnowledgeService;