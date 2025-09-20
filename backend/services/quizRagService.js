// Quiz-specific RAG Service for retrieving CNA training content
// Handles content retrieval from the quiz-content namespace in Pinecone

const EmbeddingService = require('./embeddingService');
const KnowledgeBase = require('./knowledgeBase');

class QuizRAGService {
  constructor() {
    this.embeddingService = null;
    this.knowledgeBase = null;
    this.initialized = false;
    this.namespace = 'quiz-content';
  }

  /**
   * Initialize the service with embedding and knowledge base
   */
  async initialize() {
    try {
      const googleApiKey = process.env.GOOGLE_API_KEY;
      const pineconeApiKey = process.env.PINECONE_API_KEY;

      if (!googleApiKey || !pineconeApiKey) {
        throw new Error('API keys not configured for quiz RAG service');
      }

      this.embeddingService = new EmbeddingService(googleApiKey);
      this.knowledgeBase = new KnowledgeBase(pineconeApiKey);
      await this.knowledgeBase.initialize();

      this.initialized = true;
      console.log('Quiz RAG Service initialized');
    } catch (error) {
      console.error('Error initializing Quiz RAG Service:', error);
      throw error;
    }
  }

  /**
   * Retrieve content for Physical Care Skills domain
   * @param {number} topK - Number of results to return
   * @returns {Array} Relevant content chunks
   */
  async getPhysicalCareContent(topK = 15) {
    const queries = [
      'hygiene personal care bathing grooming',
      'nutrition feeding assistance eating',
      'infection control standard precautions handwashing',
      'safety emergency procedures fall prevention',
      'basic nursing skills vital signs measurements',
      'mobility positioning transfer assistance',
      'restorative care rehabilitation exercises'
    ];

    return await this._getContentForQueries(queries, topK);
  }

  /**
   * Retrieve content for Psychosocial Care Skills domain
   * @param {number} topK - Number of results to return
   * @returns {Array} Relevant content chunks
   */
  async getPsychosocialContent(topK = 8) {
    const queries = [
      'emotional support mental health care',
      'spiritual care needs religious preferences',
      'cultural sensitivity diversity cultural needs',
      'cognitively impaired residents dementia care',
      'end of life care dying patients comfort'
    ];

    return await this._getContentForQueries(queries, topK);
  }

  /**
   * Retrieve content for Role of the Nurse Aide domain
   * @param {number} topK - Number of results to return
   * @returns {Array} Relevant content chunks
   */
  async getRoleOfNurseAideContent(topK = 12) {
    const queries = [
      'communication interpersonal skills professional',
      'resident rights ethics patient rights',
      'teamwork professional boundaries workplace',
      'legal regulatory requirements compliance',
      'documentation reporting charting records',
      'workplace safety professionalism conduct'
    ];

    return await this._getContentForQueries(queries, topK);
  }

  /**
   * Get content for all domains with proper distribution
   * @param {number} totalQuestions - Total number of questions needed
   * @returns {Object} Content organized by domain
   */
  async getAllDomainContent(totalQuestions = 30) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('🔍 Retrieving content for all CNA domains...');

      // Calculate content needs based on question distribution
      const physicalCareCount = Math.round(totalQuestions * 0.64);
      const psychosocialCount = Math.round(totalQuestions * 0.10);
      const nurseAideRoleCount = totalQuestions - physicalCareCount - psychosocialCount;

      // Retrieve content for each domain (more content than questions for variety)
      const [physicalCareContent, psychosocialContent, roleContent] = await Promise.all([
        this.getPhysicalCareContent(physicalCareCount * 2),
        this.getPsychosocialContent(psychosocialCount * 3),
        this.getRoleOfNurseAideContent(nurseAideRoleCount * 2)
      ]);

      console.log(`📚 Retrieved content: Physical Care (${physicalCareContent.length}), Psychosocial (${psychosocialContent.length}), Role of Nurse Aide (${roleContent.length})`);

      return {
        physicalCare: {
          content: physicalCareContent,
          questionCount: physicalCareCount,
          domain: 'Physical Care Skills'
        },
        psychosocial: {
          content: psychosocialContent,
          questionCount: psychosocialCount,
          domain: 'Psychosocial Care Skills'
        },
        roleOfNurseAide: {
          content: roleContent,
          questionCount: nurseAideRoleCount,
          domain: 'Role of the Nurse Aide'
        }
      };
    } catch (error) {
      console.error('Error retrieving domain content:', error);
      throw error;
    }
  }

  /**
   * Search for specific quiz content by topic
   * @param {string} query - Search query
   * @param {number} topK - Number of results
   * @returns {Array} Relevant content
   */
  async searchQuizContent(query, topK = 10) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`🔍 Searching quiz content for: "${query}"`);
      
      // Create embedding for the query
      const queryEmbedding = await this.embeddingService.createQueryEmbedding(query);
      
      // Query the quiz-content namespace
      const results = await this.knowledgeBase.index.namespace(this.namespace).query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true,
        includeValues: false
      });

      // Format results
      const documents = results.matches
        ?.filter(match => match.score >= 0.5) // Minimum relevance threshold
        .map(match => ({
          id: match.id,
          content: match.metadata.content,
          score: match.score,
          source: match.metadata.source || 'quiz-content',
          title: match.metadata.title || '',
          chapterNumber: match.metadata.chapterNumber || '',
          sourceUrl: match.metadata.sourceUrl || '',
          contentType: match.metadata.contentType || 'quiz-content'
        })) || [];

      console.log(`📖 Found ${documents.length} relevant content chunks`);
      return documents;
    } catch (error) {
      console.error('Error searching quiz content:', error);
      return [];
    }
  }

  /**
   * Private method to get content for multiple queries
   * @param {Array} queries - Array of query strings
   * @param {number} totalTopK - Total number of results needed
   * @returns {Array} Combined and deduplicated results
   */
  async _getContentForQueries(queries, totalTopK) {
    const resultsPerQuery = Math.ceil(totalTopK / queries.length);
    const allResults = [];
    const seenIds = new Set();

    for (const query of queries) {
      try {
        const results = await this.searchQuizContent(query, resultsPerQuery);
        
        // Add unique results
        for (const result of results) {
          if (!seenIds.has(result.id)) {
            seenIds.add(result.id);
            allResults.push(result);
          }
        }
      } catch (error) {
        console.warn(`Error querying for "${query}":`, error.message);
      }
    }

    // Sort by relevance score and return top results
    return allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, totalTopK);
  }

  /**
   * Get content summary for prompt generation
   * @param {Array} contentChunks - Array of content chunks
   * @returns {string} Formatted content summary
   */
  formatContentForPrompt(contentChunks) {
    if (!contentChunks || contentChunks.length === 0) {
      return 'No specific content available.';
    }

    const formattedContent = contentChunks
      .slice(0, 10) // Limit to top 10 most relevant chunks
      .map((chunk, index) => {
        const title = chunk.title ? `[${chunk.title}] ` : '';
        return `${index + 1}. ${title}${chunk.content.substring(0, 300)}...`;
      })
      .join('\n\n');

    return `REFERENCE CONTENT:\n${formattedContent}`;
  }

  /**
   * Get content for a specific domain (competency area)
   * @param {string} competencyArea - The competency area to get content for
   * @param {number} topK - Number of results to return
   * @returns {string} Formatted content for the domain
   */
  async getContentForDomain(competencyArea, topK = 15) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let contentChunks = [];
      
      // Map competency areas to appropriate content retrieval methods
      switch (competencyArea) {
        case 'Physical Care Skills':
          contentChunks = await this.getPhysicalCareContent(topK);
          break;
        case 'Psychosocial Care Skills':
          contentChunks = await this.getPsychosocialContent(topK);
          break;
        case 'Role of the Nurse Aide':
          contentChunks = await this.getRoleOfNurseAideContent(topK);
          break;
        default:
          console.warn(`Unknown competency area: ${competencyArea}, using general search`);
          contentChunks = await this.searchQuizContent(competencyArea, topK);
      }

      // Format content for prompt generation
      return this.formatContentForPrompt(contentChunks);
    } catch (error) {
      console.error(`Error getting content for domain ${competencyArea}:`, error);
      throw error;
    }
  }

  /**
   * Get health check status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      namespace: this.namespace,
      hasEmbeddingService: !!this.embeddingService,
      hasKnowledgeBase: !!this.knowledgeBase
    };
  }
}

module.exports = QuizRAGService;