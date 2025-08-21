// Pinecone-based Knowledge Base for CNA Skills Verification
// Handles vector storage, retrieval, and management of CNA skill knowledge

import { Pinecone } from '@pinecone-database/pinecone';

class KnowledgeBase {
  constructor(apiKey, environment = 'us-east1-gcp') {
    this.pinecone = new Pinecone({
      apiKey: apiKey,
      environment: environment
    });
    this.index = null;
    this.indexName = 'cna-skills-knowledge';
    this.dimension = 768; // Google text-embedding-004 dimension
  }

  /**
   * Initialize the Pinecone index
   */
  async initialize() {
    try {
      // Check if index exists
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        console.log(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: this.dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        // Wait for index to be ready
        await this.waitForIndexReady();
      }

      this.index = this.pinecone.index(this.indexName);
      console.log(`Connected to Pinecone index: ${this.indexName}`);
    } catch (error) {
      console.error('Error initializing Pinecone index:', error);
      throw error;
    }
  }

  /**
   * Wait for index to be ready after creation
   */
  async waitForIndexReady(maxRetries = 30, delayMs = 2000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const indexDescription = await this.pinecone.describeIndex(this.indexName);
        if (indexDescription.status?.ready) {
          console.log('Index is ready');
          return;
        }
      } catch (error) {
        console.log(`Waiting for index to be ready... (attempt ${i + 1}/${maxRetries})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    throw new Error('Index did not become ready within the expected time');
  }

  /**
   * Add embeddings to the knowledge base
   * @param {Array} embeddings - Array of embedding objects
   */
  async addDocuments(embeddings) {
    if (!this.index) {
      throw new Error('Index not initialized. Call initialize() first.');
    }

    try {
      // Convert embeddings to Pinecone format
      const vectors = embeddings.map(embedding => ({
        id: embedding.id,
        values: embedding.embedding,
        metadata: {
          skillId: embedding.skillId,
          content: embedding.content,
          source: embedding.metadata.source,
          criticality: embedding.metadata.criticality,
          tags: embedding.metadata.tags,
          chunkIndex: embedding.metadata.chunkIndex,
          totalChunks: embedding.metadata.totalChunks
        }
      }));

      // Batch upsert vectors (Pinecone handles batching internally)
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await this.index.upsert(batch);
        console.log(`Upserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(vectors.length / batchSize)}`);
      }

      console.log(`Successfully added ${embeddings.length} documents to knowledge base`);
    } catch (error) {
      console.error('Error adding documents to Pinecone:', error);
      throw error;
    }
  }

  /**
   * Query the knowledge base for relevant information
   * @param {Array} queryEmbedding - Query embedding vector
   * @param {Object} options - Query options
   * @returns {Object} Query results
   */
  async query(queryEmbedding, options = {}) {
    if (!this.index) {
      throw new Error('Index not initialized. Call initialize() first.');
    }

    const {
      skillId = null,
      topK = 5,
      includeMetadata = true,
      minScore = 0.7,
      tags = null,
      criticality = null
    } = options;

    try {
      // Build filter based on options
      const filter = {};
      if (skillId) filter.skillId = { $eq: skillId };
      if (tags) filter.tags = { $in: tags };
      if (criticality) filter.criticality = { $eq: criticality };

      const queryRequest = {
        vector: queryEmbedding,
        topK,
        includeMetadata,
        includeValues: false
      };

      // Add filter if any conditions are specified
      if (Object.keys(filter).length > 0) {
        queryRequest.filter = filter;
      }

      const results = await this.index.query(queryRequest);

      // Filter results by minimum score
      const filteredMatches = results.matches?.filter(match => 
        match.score >= minScore
      ) || [];

      return {
        matches: filteredMatches,
        usage: results.usage
      };
    } catch (error) {
      console.error('Error querying Pinecone:', error);
      throw error;
    }
  }

  /**
   * Search for relevant knowledge based on text query
   * @param {string} queryText - Text query
   * @param {Function} embeddingFunction - Function to create embeddings
   * @param {Object} options - Query options
   * @returns {Object} Search results with content
   */
  async search(queryText, embeddingFunction, options = {}) {
    try {
      // Create embedding for query text
      const queryEmbedding = await embeddingFunction(queryText);
      
      // Query Pinecone
      const results = await this.query(queryEmbedding, options);
      
      // Extract content and metadata
      const documents = results.matches.map(match => ({
        id: match.id,
        content: match.metadata.content,
        score: match.score,
        skillId: match.metadata.skillId,
        source: match.metadata.source,
        criticality: match.metadata.criticality,
        tags: match.metadata.tags
      }));

      return {
        documents,
        totalResults: results.matches.length
      };
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      throw error;
    }
  }

  /**
   * Get statistics about the knowledge base
   * @returns {Object} Index statistics
   */
  async getStats() {
    if (!this.index) {
      throw new Error('Index not initialized. Call initialize() first.');
    }

    try {
      const stats = await this.index.describeIndexStats();
      return {
        totalVectors: stats.totalVectorCount,
        dimension: stats.dimension,
        indexFullness: stats.indexFullness,
        namespaces: stats.namespaces
      };
    } catch (error) {
      console.error('Error getting index stats:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by skill ID
   * @param {string} skillId - Skill ID to delete vectors for
   */
  async deleteBySkillId(skillId) {
    if (!this.index) {
      throw new Error('Index not initialized. Call initialize() first.');
    }

    try {
      await this.index.deleteMany({
        filter: { skillId: { $eq: skillId } }
      });
      console.log(`Deleted all vectors for skill: ${skillId}`);
    } catch (error) {
      console.error(`Error deleting vectors for skill ${skillId}:`, error);
      throw error;
    }
  }

  /**
   * Update document content and re-embed
   * @param {string} documentId - Document ID to update
   * @param {Object} newEmbedding - New embedding data
   */
  async updateDocument(documentId, newEmbedding) {
    if (!this.index) {
      throw new Error('Index not initialized. Call initialize() first.');
    }

    try {
      const vector = {
        id: newEmbedding.id,
        values: newEmbedding.embedding,
        metadata: {
          skillId: newEmbedding.skillId,
          content: newEmbedding.content,
          source: newEmbedding.metadata.source,
          criticality: newEmbedding.metadata.criticality,
          tags: newEmbedding.metadata.tags,
          chunkIndex: newEmbedding.metadata.chunkIndex,
          totalChunks: newEmbedding.metadata.totalChunks
        }
      };

      await this.index.upsert([vector]);
      console.log(`Updated document: ${documentId}`);
    } catch (error) {
      console.error(`Error updating document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup and close connections
   */
  async cleanup() {
    // Pinecone doesn't require explicit cleanup for the client
    console.log('Knowledge base cleanup completed');
  }
}

export default KnowledgeBase;