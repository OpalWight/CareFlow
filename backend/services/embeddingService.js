// Google Embeddings Service for CNA Skills Verification
// Uses Google's text-embedding-004 model for creating vector embeddings

class EmbeddingService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'models/text-embedding-004';
  }

  /**
   * Create embeddings for a batch of documents
   * @param {Array} documents - Array of document objects with content
   * @returns {Array} Array of embedding objects
   */
  async createEmbeddings(documents) {
    const embeddings = [];
    
    for (const doc of documents) {
      try {
        // Chunk documents for better retrieval performance
        const chunks = this.chunkDocument(doc.content, 512);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await this.createSingleEmbedding(chunk.text);
          
          embeddings.push({
            id: `${doc.id}-chunk-${i}`,
            skillId: doc.skillId,
            content: chunk.text,
            embedding: embedding,
            metadata: {
              source: doc.source,
              criticality: doc.criticality,
              tags: doc.tags,
              chunkIndex: i,
              totalChunks: chunks.length,
              startIndex: chunk.startIndex,
              endIndex: chunk.endIndex
            }
          });
        }
      } catch (error) {
        console.error(`Error creating embedding for document ${doc.id}:`, error);
      }
    }
    
    return embeddings;
  }

  /**
   * Create embedding for a single text
   * @param {string} text - Text to embed
   * @returns {Array} Embedding vector
   */
  async createSingleEmbedding(text) {
    const response = await fetch(`${this.baseUrl}/${this.model}:embedContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        content: {
          parts: [{ text: text }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.embedding.values;
  }

  /**
   * Create embedding for query text
   * @param {string} queryText - Query text to embed
   * @returns {Array} Query embedding vector
   */
  async createQueryEmbedding(queryText) {
    return await this.createSingleEmbedding(queryText);
  }

  /**
   * Chunk document into smaller pieces for better retrieval
   * @param {string} content - Document content
   * @param {number} maxTokens - Maximum tokens per chunk (approximate)
   * @returns {Array} Array of text chunks with metadata
   */
  chunkDocument(content, maxTokens = 512) {
    const chunks = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let currentTokenCount = 0;
    let startIndex = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim() + '.';
      const sentenceTokenCount = this.approximateTokenCount(sentence);
      
      // If adding this sentence would exceed maxTokens, save current chunk
      if (currentTokenCount + sentenceTokenCount > maxTokens && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          startIndex: startIndex,
          endIndex: startIndex + currentChunk.length,
          tokenCount: currentTokenCount
        });
        
        // Start new chunk with overlap (include last sentence for context)
        const lastSentence = sentences[Math.max(0, i - 1)].trim() + '.';
        currentChunk = lastSentence + ' ' + sentence;
        currentTokenCount = this.approximateTokenCount(currentChunk);
        startIndex = startIndex + currentChunk.length - sentence.length;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokenCount += sentenceTokenCount;
      }
    }
    
    // Add final chunk if not empty
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        startIndex: startIndex,
        endIndex: startIndex + currentChunk.length,
        tokenCount: currentTokenCount
      });
    }
    
    return chunks;
  }

  /**
   * Approximate token count for text
   * @param {string} text - Text to count tokens for
   * @returns {number} Approximate token count
   */
  approximateTokenCount(text) {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Batch process multiple documents with rate limiting
   * @param {Array} documents - Documents to process
   * @param {number} batchSize - Number of documents to process at once
   * @param {number} delayMs - Delay between batches in milliseconds
   * @returns {Array} All embeddings
   */
  async createEmbeddingsBatch(documents, batchSize = 10, delayMs = 1000) {
    const allEmbeddings = [];
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      console.log(`Processing embedding batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(documents.length / batchSize)}`);
      
      const batchEmbeddings = await this.createEmbeddings(batch);
      allEmbeddings.push(...batchEmbeddings);
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return allEmbeddings;
  }
}

module.exports = EmbeddingService;