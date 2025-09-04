const mongoose = require('mongoose');
require('dotenv').config();

const QuizResult = require('../models/QuizResult');
const QuizPool = require('../models/QuizPool');
const crypto = require('crypto');

/**
 * Migration script to handle legacy quiz data and ensure QuizPool consistency
 * Run this script to:
 * 1. Create QuizPool entries for orphaned QuizResults
 * 2. Clean up inconsistent data
 * 3. Report on system health
 */

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}

async function analyzeQuizData() {
    console.log('📊 Analyzing quiz data...');
    
    const totalQuizResults = await QuizResult.countDocuments();
    const totalQuizPools = await QuizPool.countDocuments();
    const activeQuizPools = await QuizPool.countDocuments({ isActive: true });
    
    console.log(`Total QuizResults: ${totalQuizResults}`);
    console.log(`Total QuizPools: ${totalQuizPools}`);
    console.log(`Active QuizPools: ${activeQuizPools}`);
    
    // Find QuizResults without corresponding QuizPool entries
    const quizResults = await QuizResult.find().limit(100);
    const orphanedResults = [];
    
    for (const result of quizResults) {
        // Check if there's a QuizPool with similar questions
        const poolExists = await QuizPool.findOne({
            'questions.question': result.questions[0]?.question
        });
        
        if (!poolExists && result.questions.length > 0) {
            orphanedResults.push(result);
        }
    }
    
    console.log(`Found ${orphanedResults.length} potentially orphaned quiz results`);
    return { orphanedResults, totalQuizResults, totalQuizPools, activeQuizPools };
}

function generateQuizId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `migrated_${timestamp}_${random}`;
}

function calculateDistribution(questions) {
    const distribution = {
        physicalCareSkills: 0,
        psychosocialCareSkills: 0,
        roleOfNurseAide: 0
    };

    questions.forEach(q => {
        switch (q.competencyArea) {
            case 'Physical Care Skills':
                distribution.physicalCareSkills++;
                break;
            case 'Psychosocial Care Skills':
                distribution.psychosocialCareSkills++;
                break;
            case 'Role of the Nurse Aide':
                distribution.roleOfNurseAide++;
                break;
        }
    });

    return distribution;
}

async function createQuizPoolFromResult(quizResult) {
    try {
        const quizId = generateQuizId();
        const distribution = calculateDistribution(quizResult.questions);
        
        // Convert QuizResult questions to QuizPool format
        const questions = quizResult.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            competencyArea: q.competencyArea,
            explanation: q.explanation || 'Migrated from legacy quiz result',
            difficulty: 'intermediate' // Default difficulty for migrated quizzes
        }));
        
        const quizPool = new QuizPool({
            quizId,
            questions,
            metadata: {
                totalQuestions: questions.length,
                difficulty: 'intermediate',
                distribution,
                generationMethod: 'legacy-migration',
                ragSources: [],
                qualityScore: 60 // Conservative quality score for migrated data
            },
            usedBy: [{
                userId: quizResult.userId,
                usedAt: quizResult.timeCompleted,
                lastUsedAt: quizResult.timeCompleted,
                score: quizResult.score,
                percentage: quizResult.percentage
            }],
            isActive: true,
            usageStats: {
                totalUses: 1,
                averageScore: quizResult.score,
                averageCompletionTime: quizResult.durationMinutes || 30,
                difficultyRating: 5
            },
            createdBy: 'migration-script'
        });
        
        await quizPool.save();
        console.log(`✅ Created QuizPool entry for legacy quiz: ${quizId}`);
        return quizId;
        
    } catch (error) {
        console.error(`❌ Failed to create QuizPool for result ${quizResult._id}:`, error.message);
        return null;
    }
}

async function migrateOrphanedQuizzes(orphanedResults) {
    console.log(`🔄 Migrating ${orphanedResults.length} orphaned quiz results...`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const result of orphanedResults.slice(0, 10)) { // Limit to 10 for safety
        const quizId = await createQuizPoolFromResult(result);
        if (quizId) {
            migratedCount++;
        } else {
            errorCount++;
        }
        
        // Add small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Migration complete: ${migratedCount} successful, ${errorCount} errors`);
    return { migratedCount, errorCount };
}

async function cleanupDuplicateQuizPools() {
    console.log('🧹 Cleaning up potential duplicate quiz pools...');
    
    const duplicates = await QuizPool.aggregate([
        {
            $group: {
                _id: { firstQuestion: { $arrayElemAt: ['$questions.question', 0] } },
                count: { $sum: 1 },
                docs: { $push: '$_id' }
            }
        },
        {
            $match: { count: { $gt: 1 } }
        }
    ]);
    
    console.log(`Found ${duplicates.length} potential duplicate groups`);
    
    let cleanedCount = 0;
    for (const duplicate of duplicates) {
        // Keep the first one, mark others as retired
        const [keep, ...retire] = duplicate.docs;
        
        for (const docId of retire) {
            await QuizPool.updateOne(
                { _id: docId },
                { 
                    isActive: false, 
                    retiredAt: new Date(), 
                    retirementReason: 'Duplicate detected during migration' 
                }
            );
            cleanedCount++;
        }
    }
    
    console.log(`✅ Retired ${cleanedCount} duplicate quiz pools`);
    return cleanedCount;
}

async function generatePoolHealth() {
    console.log('📊 Generating pool health report...');
    
    const stats = await QuizPool.getPoolStats();
    const poolHealth = {
        score: 100,
        status: 'excellent',
        issues: []
    };
    
    if (stats.totalActiveQuizzes < 50) {
        poolHealth.score -= 30;
        poolHealth.issues.push(`Low quiz count: ${stats.totalActiveQuizzes}`);
    }
    
    if (stats.averageQualityScore < 70) {
        poolHealth.score -= 20;
        poolHealth.issues.push(`Low average quality: ${stats.averageQualityScore}`);
    }
    
    if (poolHealth.score >= 80) poolHealth.status = 'excellent';
    else if (poolHealth.score >= 60) poolHealth.status = 'good';
    else if (poolHealth.score >= 40) poolHealth.status = 'fair';
    else poolHealth.status = 'poor';
    
    console.log(`📊 Pool Health: ${poolHealth.status} (${poolHealth.score}/100)`);
    if (poolHealth.issues.length > 0) {
        console.log(`⚠️ Issues found:`);
        poolHealth.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    return { stats, poolHealth };
}

async function main() {
    console.log('🚀 Starting quiz data migration...');
    
    await connectDB();
    
    try {
        // Step 1: Analyze current data
        const analysis = await analyzeQuizData();
        
        // Step 2: Migrate orphaned quizzes (if any found)
        if (analysis.orphanedResults.length > 0) {
            await migrateOrphanedQuizzes(analysis.orphanedResults);
        } else {
            console.log('✅ No orphaned quiz results found');
        }
        
        // Step 3: Clean up duplicates
        await cleanupDuplicateQuizPools();
        
        // Step 4: Generate health report
        await generatePoolHealth();
        
        console.log('✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
}

// Run the migration if this script is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    analyzeQuizData,
    migrateOrphanedQuizzes,
    cleanupDuplicateQuizPools,
    generatePoolHealth
};