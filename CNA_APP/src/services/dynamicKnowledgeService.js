// Dynamic Knowledge Management Service
// Handles CRUD operations for dynamic knowledge documents with automatic re-embedding

import axios from 'axios';
import EmbeddingService from './embeddingService';
import KnowledgeBase from './knowledgeBase';
import { CNA_KNOWLEDGE_DOCUMENTS } from '../data/cnaKnowledgeBase';

class DynamicKnowledgeService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.apiClient = axios.create({
      baseURL: `${this.baseUrl}/api/knowledge`,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    this.embeddingService = null;
    this.knowledgeBase = null;
    this.initialized = false;
  }

  /**
   * Initialize the service with embedding and knowledge base
   */
  async initialize() {
    try {
      const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const pineconeApiKey = import.meta.env.VITE_PINECONE_API_KEY;

      if (!googleApiKey || !pineconeApiKey) {
        throw new Error('API keys not configured for dynamic knowledge service');
      }

      this.embeddingService = new EmbeddingService(googleApiKey);
      this.knowledgeBase = new KnowledgeBase(pineconeApiKey);
      await this.knowledgeBase.initialize();

      // Add auth token to requests if available
      const token = localStorage.getItem('authToken');
      if (token) {
        this.apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      }

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
      const response = await this.apiClient.get('/documents', { params: filters });
      return response.data;
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
      const response = await this.apiClient.get(`/documents/skill/${skillId}`);
      return response.data;
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
      const response = await this.apiClient.get(`/documents/${documentId}`);
      return response.data;
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
      const response = await this.apiClient.post('/documents', documentData);
      const createdDocument = response.data;

      // Automatically create embeddings for the new document
      await this.createEmbeddingsForDocument(createdDocument);

      return createdDocument;
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
      const response = await this.apiClient.put(`/documents/${documentId}`, updateData);
      const updatedDocument = response.data;

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
      await this.apiClient.delete(`/documents/${documentId}`);
      
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
      const response = await this.apiClient.get('/documents/search', {
        params: { q: query, ...filters }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error('Failed to search knowledge documents');
    }
  }

  /**
   * Get combined knowledge for RAG (dynamic + static fallback)
   * Priority: Dynamic documents first, then static as fallback
   * @param {string} queryText - Query text
   * @param {string} skillId - Skill ID
   * @param {Object} options - Search options
   * @returns {Array} Combined knowledge documents
   */
  async getCombinedKnowledge(queryText, skillId, options = {}) {
    try {
      let combinedResults = [];
      
      // 1. First try to get dynamic knowledge from vector database
      if (this.initialized && this.knowledgeBase) {
        try {
          const dynamicResults = await this.knowledgeBase.search(
            queryText,
            (text) => this.embeddingService.createQueryEmbedding(text),
            {
              skillId: skillId,
              topK: options.topK || 3,
              minScore: options.minScore || 0.7,
              // Filter for dynamic documents
              source: { $ne: 'static-hardcoded' }
            }
          );
          
          combinedResults = [...dynamicResults.documents];
          
          // Mark as dynamic
          combinedResults.forEach(doc => {
            doc.source_type = 'dynamic';
            doc.priority = 1;
          });
          
          console.log(`Found ${combinedResults.length} dynamic knowledge documents`);
        } catch (error) {
          console.warn('Error retrieving dynamic knowledge:', error);
        }
      }
      
      // 2. If we don't have enough dynamic results, supplement with static
      const neededResults = (options.topK || 5) - combinedResults.length;
      if (neededResults > 0) {
        const staticDocs = this.getStaticKnowledgeForSkill(skillId, queryText);
        const staticResults = staticDocs.slice(0, neededResults).map(doc => ({
          content: doc.content,
          score: 0.8, // Give static docs a reasonable score
          skillId: doc.skillId,
          source: doc.source,
          criticality: doc.criticality,
          tags: doc.tags,
          source_type: 'static',
          priority: 2
        }));
        
        combinedResults = [...combinedResults, ...staticResults];
        console.log(`Added ${staticResults.length} static fallback documents`);
      }
      
      // 3. Sort by priority (dynamic first) then by score
      combinedResults.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return b.score - a.score;
      });
      
      return {
        documents: combinedResults,
        totalResults: combinedResults.length,
        hasDynamicContent: combinedResults.some(doc => doc.source_type === 'dynamic'),
        hasStaticFallback: combinedResults.some(doc => doc.source_type === 'static')
      };
    } catch (error) {
      console.error('Error getting combined knowledge:', error);
      
      // Complete fallback to static knowledge
      const staticDocs = this.getStaticKnowledgeForSkill(skillId, queryText);
      return {
        documents: staticDocs.slice(0, options.topK || 5).map(doc => ({
          content: doc.content,
          score: 0.7,
          skillId: doc.skillId,
          source: doc.source,
          criticality: doc.criticality,
          tags: doc.tags,
          source_type: 'static',
          priority: 2
        })),
        totalResults: Math.min(staticDocs.length, options.topK || 5),
        hasDynamicContent: false,
        hasStaticFallback: true
      };
    }
  }

  /**
   * Get static knowledge documents for a skill (fallback)
   * @param {string} skillId - Skill ID
   * @param {string} queryText - Query text for relevance
   * @returns {Array} Static knowledge documents
   */
  getStaticKnowledgeForSkill(skillId, queryText = '') {
    const relevantDocs = CNA_KNOWLEDGE_DOCUMENTS.filter(doc => 
      doc.skillId === skillId || doc.skillId === 'general'
    );
    
    // Simple relevance scoring based on text matching
    if (queryText) {
      const query = queryText.toLowerCase();
      return relevantDocs
        .map(doc => ({
          ...doc,
          relevance: this.calculateTextRelevance(doc.content.toLowerCase(), query)
        }))
        .sort((a, b) => b.relevance - a.relevance);
    }
    
    return relevantDocs;
  }

  /**
   * Simple text relevance calculation
   * @param {string} content - Document content
   * @param {string} query - Query text
   * @returns {number} Relevance score
   */
  calculateTextRelevance(content, query) {
    const queryWords = query.split(' ').filter(word => word.length > 2);
    let score = 0;
    
    queryWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      const matches = (content.match(regex) || []).length;
      score += matches;
    });
    
    return score;
  }

  /**
   * Create embeddings for a new document
   * @param {Object} document - Document object
   */
  async createEmbeddingsForDocument(document) {
    if (!this.initialized) return;
    
    try {
      console.log(`Creating embeddings for document ${document.id}`);
      
      // Create embeddings
      const embeddings = await this.embeddingService.createEmbeddings([document]);
      
      // Store in vector database with dynamic source marker
      const vectorEmbeddings = embeddings.map(emb => ({
        ...emb,
        metadata: {
          ...emb.metadata,
          source_type: 'dynamic',
          document_id: document._id || document.id,
          created_at: new Date().toISOString()
        }
      }));
      
      await this.knowledgeBase.addDocuments(vectorEmbeddings);
      
      // Update document with embedding IDs
      const embeddingIds = embeddings.map((emb, index) => ({
        chunkId: emb.id,
        vectorId: emb.id,
        chunkIndex: index
      }));
      
      await this.apiClient.post(`/documents/${document._id || document.id}/embeddings`, {
        embeddingIds,
        status: 'completed'
      });
      
      console.log(`Successfully created ${embeddings.length} embeddings for document ${document.id}`);
    } catch (error) {
      console.error(`Error creating embeddings for document ${document.id}:`, error);
      
      // Mark embedding as failed
      try {
        await this.apiClient.post(`/documents/${document._id || document.id}/embeddings`, {
          status: 'failed'
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
      const documentId = document._id || document.id;
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
   * Refresh all embeddings for all active documents
   */
  async refreshAllEmbeddings() {
    try {
      console.log('Starting refresh of all embeddings...');
      
      const documents = await this.getAllDocuments({ 
        isActive: true, 
        status: 'published' 
      });
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const document of documents) {
        try {
          await this.createEmbeddingsForDocument(document);
          successCount++;
        } catch (error) {
          console.error(`Failed to refresh embeddings for document ${document.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`Embedding refresh completed. Success: ${successCount}, Errors: ${errorCount}`);
      return { successCount, errorCount, totalProcessed: documents.length };
    } catch (error) {
      console.error('Error refreshing all embeddings:', error);
      throw error;
    }
  }

  /**
   * Import documents from JSON files
   * @param {FileList} files - Files to import
   * @returns {Object} Import results
   */
  async importDocuments(files) {
    const results = { successful: 0, failed: 0, errors: [] };
    
    for (const file of files) {
      try {
        const content = await this.readFileAsText(file);
        const documents = JSON.parse(content);
        
        if (!Array.isArray(documents)) {
          throw new Error('File must contain an array of documents');
        }
        
        for (const docData of documents) {
          try {
            await this.createDocument(docData);
            results.successful++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to import ${docData.title || 'unknown'}: ${error.message}`);
          }
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to process file ${file.name}: ${error.message}`);
      }
    }
    
    return results;
  }

  /**
   * Export all documents as JSON
   * @returns {Array} All documents
   */
  async exportAllDocuments() {
    try {
      const documents = await this.getAllDocuments();
      
      // Clean up documents for export (remove internal fields)
      const cleanedDocuments = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        skillId: doc.skillId,
        category: doc.category,
        source: doc.source,
        criticality: doc.criticality,
        tags: doc.tags,
        version: doc.version,
        status: doc.status
      }));
      
      return cleanedDocuments;
    } catch (error) {
      console.error('Error exporting documents:', error);
      throw error;
    }
  }

  /**
   * Get system statistics
   * @returns {Object} System stats
   */
  async getStats() {
    try {
      const response = await this.apiClient.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalDocuments: 0,
        lastUpdated: null,
        embeddingStatus: 'unknown'
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

  /**
   * Read file as text
   * @param {File} file - File to read
   * @returns {Promise<string>} File content
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export default DynamicKnowledgeService;