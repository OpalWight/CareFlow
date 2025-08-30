// Script to upload scraped content to Pinecone under 'quiz content' namespace
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const { Pinecone } = require('@pinecone-database/pinecone');

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
console.log('🔍 Loading env file:', envFile);
dotenv.config({ path: path.join(__dirname, '..', envFile) });

// Always load main .env as fallback
console.log('🔍 Loading fallback .env file');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Debug environment variables
console.log('🔍 Environment check: {');
console.log('  PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? 'Set ✅' : 'Not set ❌');
console.log('  GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Set ✅' : 'Not set ❌');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? 'Set ✅' : 'Not set ❌');
console.log('}');

class QuizContentUploader {
  constructor(apiKey) {
    this.pinecone = new Pinecone({
      apiKey: apiKey
    });
    this.index = null;
    this.indexName = 'cna-skills-knowledge';
    this.namespace = 'quiz-content';
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
   * Create embedding for text using Google's API
   */
  async createEmbedding(text) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    const model = 'models/text-embedding-004';

    const response = await fetch(`${baseUrl}/${model}:embedContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
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
   * Upload scraped content to Pinecone
   */
  async uploadScrapedContent(scrapedContentPath) {
    try {
      console.log('🚀 Starting scraped content upload process...');
      
      // Read scraped content file
      const rawData = await fs.readFile(scrapedContentPath, 'utf8');
      const scrapedContent = JSON.parse(rawData);
      
      console.log(`📁 Loaded ${scrapedContent.length} content chunks from scraped file`);

      // Process content in batches to avoid rate limits
      const batchSize = 10;
      let processedCount = 0;
      const totalBatches = Math.ceil(scrapedContent.length / batchSize);

      for (let i = 0; i < scrapedContent.length; i += batchSize) {
        const batch = scrapedContent.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)...`);
        
        // Create vectors for this batch
        const vectors = [];
        
        for (const item of batch) {
          try {
            // Create embedding for the content
            const embedding = await this.createEmbedding(item.content);
            
            // Prepare vector for Pinecone
            const vector = {
              id: item.ID,
              values: embedding,
              metadata: {
                content: item.content,
                skillId: item.skillId || 'general',
                source: item.source || 'scraped_content',
                criticality: item.criticality || 'medium',
                tags: item.tags || [],
                chunkIndex: item.chunkIndex || 0,
                totalChunks: item.totalChunks || 1,
                // Additional metadata from scraped content
                sourceUrl: item.metadata?.source_url || '',
                title: item.metadata?.title || '',
                chapterNumber: item.metadata?.chapter_number || '',
                partTitle: item.metadata?.part_title || '',
                // Mark as quiz content
                contentType: 'quiz-content',
                uploadedAt: new Date().toISOString()
              }
            };

            vectors.push(vector);
            console.log(`✅ Created embedding for: ${item.ID}`);
            
            // Small delay to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`❌ Error processing item ${item.ID}:`, error.message);
          }
        }

        // Upload batch to Pinecone with namespace
        if (vectors.length > 0) {
          try {
            await this.index.namespace(this.namespace).upsert(vectors);
            processedCount += vectors.length;
            console.log(`🎯 Successfully uploaded batch ${batchNumber} to namespace '${this.namespace}' (${vectors.length} vectors)`);
          } catch (error) {
            console.error(`❌ Error uploading batch ${batchNumber}:`, error);
          }
        }

        // Delay between batches to avoid rate limiting
        if (i + batchSize < scrapedContent.length) {
          console.log('⏳ Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`\n🎉 Upload completed! Successfully processed ${processedCount}/${scrapedContent.length} content chunks`);
      
      // Get namespace stats
      const stats = await this.getNamespaceStats();
      console.log('\n📊 Namespace statistics:');
      console.log(JSON.stringify(stats, null, 2));
      
    } catch (error) {
      console.error('❌ Error uploading scraped content:', error);
      throw error;
    }
  }

  /**
   * Get statistics about the quiz content namespace
   */
  async getNamespaceStats() {
    try {
      const stats = await this.index.describeIndexStats();
      return {
        totalVectors: stats.totalVectorCount,
        dimension: stats.dimension,
        indexFullness: stats.indexFullness,
        namespaces: stats.namespaces,
        quizContentNamespace: stats.namespaces?.[this.namespace] || { vectorCount: 0 }
      };
    } catch (error) {
      console.error('Error getting namespace stats:', error);
      return null;
    }
  }
}

// Main execution
async function main() {
  try {
    // Check for required environment variables
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    
    if (!pineconeApiKey) {
      throw new Error('PINECONE_API_KEY environment variable not set');
    }
    
    if (!googleApiKey) {
      throw new Error('GOOGLE_API_KEY environment variable not set');
    }

    // Initialize uploader
    const uploader = new QuizContentUploader(pineconeApiKey);
    await uploader.initialize();

    // Path to scraped content file
    const scrapedContentPath = path.join(__dirname, '../../scraped_content_enhanced.json');
    
    // Check if file exists
    try {
      await fs.access(scrapedContentPath);
    } catch (error) {
      throw new Error(`Scraped content file not found at: ${scrapedContentPath}`);
    }

    // Upload content
    await uploader.uploadScrapedContent(scrapedContentPath);
    
    console.log('✨ All done! Scraped content has been uploaded to Pinecone under the "quiz-content" namespace.');
    
  } catch (error) {
    console.error('💥 Upload failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = QuizContentUploader;