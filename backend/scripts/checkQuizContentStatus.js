// Script to check the status of quiz content upload in Pinecone
const path = require('path');
const dotenv = require('dotenv');
const { Pinecone } = require('@pinecone-database/pinecone');

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
console.log('🔍 Loading env file:', envFile);
dotenv.config({ path: path.join(__dirname, '..', envFile) });

// Always load main .env as fallback
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkQuizContentStatus() {
  try {
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    console.log('PINECONE_API_KEY:', pineconeApiKey);
    
    if (!pineconeApiKey) {
      throw new Error('PINECONE_API_KEY environment variable not set');
    }

    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: pineconeApiKey
    });
    
    const indexName = 'cna-skills-knowledge';
    const namespace = 'quiz-content';
    
    const index = pinecone.index(indexName);
    
    // Get index statistics
    console.log('📊 Getting Pinecone index statistics...');
    const stats = await index.describeIndexStats();
    console.log('Stats:', stats);
    
    console.log('\n🎯 Index Statistics:');
    console.log(`Total vectors: ${stats.totalRecordCount}`);
    console.log(`Dimension: ${stats.dimension}`);
    console.log(`Index fullness: ${(stats.indexFullness * 100).toFixed(2)}%`);
    
    console.log('\n📁 Namespaces:');
    if (stats.namespaces) {
      Object.entries(stats.namespaces).forEach(([ns, info]) => {
        console.log(`  ${ns}: ${info.recordCount} vectors`);
      });
    }
    
    // Check if quiz-content namespace exists and has data
    const quizContentStats = stats.namespaces?.[namespace];
    if (quizContentStats) {
      console.log(`\n✅ Quiz content namespace '${namespace}' exists with ${quizContentStats.recordCount} vectors`);
    } else {
      console.log(`\n❌ Quiz content namespace '${namespace}' not found or empty`);
    }
    
    // Try a test query to verify the data is accessible
    console.log('\n🧪 Testing query on quiz content namespace...');
    try {
      // Create a simple test embedding (zeros for testing)
      const testVector = new Array(768).fill(0.1);
      
      const queryResults = await index.namespace(namespace).query({
        vector: testVector,
        topK: 3,
        includeMetadata: true
      });
      
      if (queryResults.matches && queryResults.matches.length > 0) {
        console.log(`✅ Query test successful! Found ${queryResults.matches.length} results`);
        console.log('Sample results:');
        queryResults.matches.slice(0, 2).forEach((match, i) => {
          console.log(`  ${i + 1}. ID: ${match.id}`);
          console.log(`     Score: ${match.score.toFixed(4)}`);
          console.log(`     Content: ${match.metadata?.content?.substring(0, 100)}...`);
        });
      } else {
        console.log('⚠️  Query test returned no results');
      }
    } catch (queryError) {
      console.log(`❌ Query test failed: ${queryError.message}`);
    }
    
  } catch (error) {
    console.error('💥 Error checking status:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkQuizContentStatus();
}

module.exports = { checkQuizContentStatus };