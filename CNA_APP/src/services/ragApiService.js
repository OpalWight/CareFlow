// Frontend RAG API Service
// Handles communication with backend RAG endpoints

import API_URL from '../config/apiConfig.js';

class RAGApiService {
  constructor() {
    this.baseUrl = `${API_URL}/api/rag`;
  }

  /**
   * Verify a skill step using backend RAG service
   * @param {Object} stepData - Step data to verify
   * @returns {Object} Verification results
   */
  async verifySkillStep(stepData) {
    try {
      const response = await fetch(`${this.baseUrl}/verify-step`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stepData)
      });

      if (!response.ok) {
        throw new Error(`RAG verification failed: ${response.status}`);
      }

      const result = await response.json();
      return result.verification;
    } catch (error) {
      console.error('Error verifying skill step:', error);
      throw error;
    }
  }

  /**
   * Search knowledge base for relevant information
   * @param {string} query - Search query
   * @param {string} skillId - Skill identifier
   * @param {Object} options - Search options
   * @returns {Object} Search results
   */
  async searchKnowledge(query, skillId = null, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/search-knowledge`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, skillId, options })
      });

      if (!response.ok) {
        throw new Error(`Knowledge search failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error searching knowledge:', error);
      throw error;
    }
  }

  /**
   * Get knowledge base statistics
   * @returns {Object} Knowledge base stats
   */
  async getKnowledgeStats() {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-stats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get knowledge stats failed: ${response.status}`);
      }

      const result = await response.json();
      return result.stats;
    } catch (error) {
      console.error('Error getting knowledge stats:', error);
      throw error;
    }
  }

  /**
   * Embed documents and store in knowledge base
   * @param {Array} documents - Documents to embed
   * @returns {Object} Embedding results
   */
  async embedDocuments(documents) {
    try {
      const response = await fetch(`${this.baseUrl}/embed-documents`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documents })
      });

      if (!response.ok) {
        throw new Error(`Document embedding failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error embedding documents:', error);
      throw error;
    }
  }

  /**
   * Delete knowledge for a specific skill
   * @param {string} skillId - Skill to delete knowledge for
   * @returns {Object} Deletion result
   */
  async deleteSkillKnowledge(skillId) {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge/${skillId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Knowledge deletion failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      throw error;
    }
  }

  /**
   * Check RAG service health
   * @returns {Object} Health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking RAG health:', error);
      throw error;
    }
  }
}

export default RAGApiService;