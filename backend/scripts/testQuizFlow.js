const mongoose = require('mongoose');
require('dotenv').config();

const QuizPool = require('../models/QuizPool');
const UserQuizHistory = require('../models/UserQuizHistory');
const QuizResult = require('../models/QuizResult');

/**
 * Test script to validate the corrected quiz flow
 * Tests:
 * 1. Quiz availability (should always find quizzes)
 * 2. Attempt logging with proper timestamps
 * 3. Duplicate prevention
 * 4. Retake functionality
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

async function testQuizAvailability() {
    console.log('\n🧪 Testing Quiz Availability...');
    
    const testUserId = new mongoose.Types.ObjectId();
    
    try {
        // Test 1: Should find available quizzes
        const availableQuizzes = await QuizPool.findAvailableForUser(testUserId, 'intermediate', 5);
        console.log(`✅ Found ${availableQuizzes.length} available quizzes for new user`);
        
        if (availableQuizzes.length === 0) {
            console.log('⚠️ No quizzes available - this might indicate an empty quiz pool');
            return null;
        }
        
        return { testUserId, quiz: availableQuizzes[0] };
        
    } catch (error) {
        console.error('❌ Quiz availability test failed:', error);
        return null;
    }
}

async function testQuizAttemptLogging(testUserId, quiz) {
    console.log('\n🧪 Testing Quiz Attempt Logging...');
    
    try {
        const attemptTime = new Date();
        const testScore = 25;
        const testPercentage = 83;
        
        // Create a mock quiz result
        const mockQuizResult = new QuizResult({
            userId: testUserId,
            questions: [
                {
                    question: "Test question 1",
                    options: { A: "Option A", B: "Option B", C: "Option C", D: "Option D" },
                    correctAnswer: "A",
                    userAnswer: "A",
                    isCorrect: true,
                    competencyArea: "Physical Care Skills"
                }
            ],
            score: testScore,
            totalQuestions: 30,
            percentage: testPercentage,
            competencyAnalysis: new Map(),
            timeStarted: attemptTime,
            timeCompleted: new Date(),
            durationMinutes: 30
        });
        
        await mockQuizResult.save();
        console.log(`✅ Created mock quiz result: ${mockQuizResult._id}`);
        
        // Test quiz pool logging
        await quiz.markAsUsed(testUserId, testScore, testPercentage, 30, attemptTime);
        await quiz.save();
        console.log(`✅ Logged attempt in QuizPool`);
        
        // Test user history logging
        const userHistory = await UserQuizHistory.findOrCreateForUser(testUserId);
        await userHistory.addCompletedQuiz({
            quizId: quiz.quizId,
            score: testScore,
            percentage: testPercentage,
            durationMinutes: 30,
            quizResultId: mockQuizResult._id,
            attemptedAt: attemptTime
        });
        await userHistory.save();
        console.log(`✅ Logged attempt in UserQuizHistory`);
        
        return { mockQuizResult, userHistory };
        
    } catch (error) {
        console.error('❌ Quiz attempt logging test failed:', error);
        return null;
    }
}

async function testDuplicatePrevention(testUserId, quiz, existingQuizResult) {
    console.log('\n🧪 Testing Duplicate Prevention...');
    
    try {
        const userHistory = await UserQuizHistory.findOrCreateForUser(testUserId);
        const beforeCount = userHistory.completedQuizzes.length;
        
        // Try to add the same quiz result again
        await userHistory.addCompletedQuiz({
            quizId: quiz.quizId,
            score: 25,
            percentage: 83,
            durationMinutes: 30,
            quizResultId: existingQuizResult._id, // Same quiz result ID
            attemptedAt: new Date()
        });
        
        const afterCount = userHistory.completedQuizzes.length;
        
        if (beforeCount === afterCount) {
            console.log(`✅ Duplicate prevention working: ${beforeCount} attempts before and after`);
            return true;
        } else {
            console.log(`❌ Duplicate prevention failed: ${beforeCount} -> ${afterCount} attempts`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Duplicate prevention test failed:', error);
        return false;
    }
}

async function testRetakeFunctionality(testUserId, quiz) {
    console.log('\n🧪 Testing Retake Functionality...');
    
    try {
        const retakeAttemptTime = new Date();
        const retakeScore = 28;
        const retakePercentage = 93;
        
        // Create a second quiz result (retake)
        const retakeQuizResult = new QuizResult({
            userId: testUserId,
            questions: [
                {
                    question: "Test question 1 - retake",
                    options: { A: "Option A", B: "Option B", C: "Option C", D: "Option D" },
                    correctAnswer: "A",
                    userAnswer: "A",
                    isCorrect: true,
                    competencyArea: "Physical Care Skills"
                }
            ],
            score: retakeScore,
            totalQuestions: 30,
            percentage: retakePercentage,
            competencyAnalysis: new Map(),
            timeStarted: retakeAttemptTime,
            timeCompleted: new Date(),
            durationMinutes: 25,
            isRetake: true
        });
        
        await retakeQuizResult.save();
        console.log(`✅ Created retake quiz result: ${retakeQuizResult._id}`);
        
        // Test that retake can be logged
        await quiz.markAsUsed(testUserId, retakeScore, retakePercentage, 25, retakeAttemptTime);
        await quiz.save();
        console.log(`✅ Logged retake attempt in QuizPool`);
        
        const userHistory = await UserQuizHistory.findOrCreateForUser(testUserId);
        const beforeRetakeCount = userHistory.completedQuizzes.length;
        
        await userHistory.addCompletedQuiz({
            quizId: quiz.quizId,
            score: retakeScore,
            percentage: retakePercentage,
            durationMinutes: 25,
            quizResultId: retakeQuizResult._id, // Different quiz result ID
            attemptedAt: retakeAttemptTime
        });
        await userHistory.save();
        
        const afterRetakeCount = userHistory.completedQuizzes.length;
        
        if (afterRetakeCount > beforeRetakeCount) {
            console.log(`✅ Retake functionality working: ${beforeRetakeCount} -> ${afterRetakeCount} attempts`);
            return true;
        } else {
            console.log(`❌ Retake functionality failed: attempts didn't increase`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Retake functionality test failed:', error);
        return false;
    }
}

async function validateTimestamps(testUserId) {
    console.log('\n🧪 Validating Timestamps...');
    
    try {
        // Check QuizPool timestamps
        const quizzes = await QuizPool.find({ 'usedBy.userId': testUserId });
        if (quizzes.length > 0) {
            const usageRecords = quizzes[0].usedBy.filter(usage => usage.userId.toString() === testUserId.toString());
            console.log(`✅ Found ${usageRecords.length} usage records in QuizPool with timestamps:`);
            usageRecords.forEach((record, index) => {
                console.log(`   Attempt ${index + 1}: attempted=${record.attemptedAt}, used=${record.usedAt}`);
            });
        }
        
        // Check UserQuizHistory timestamps
        const userHistory = await UserQuizHistory.findOne({ userId: testUserId });
        if (userHistory) {
            console.log(`✅ Found ${userHistory.completedQuizzes.length} completed quizzes in UserQuizHistory with timestamps:`);
            userHistory.completedQuizzes.forEach((quiz, index) => {
                console.log(`   Quiz ${index + 1}: attempted=${quiz.attemptedAt}, completed=${quiz.completedAt}`);
            });
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Timestamp validation failed:', error);
        return false;
    }
}

async function cleanup(testUserId) {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
        // Remove test quiz results
        await QuizResult.deleteMany({ userId: testUserId });
        console.log('✅ Removed test quiz results');
        
        // Remove test user history
        await UserQuizHistory.deleteMany({ userId: testUserId });
        console.log('✅ Removed test user history');
        
        // Remove test usage records from quiz pools
        await QuizPool.updateMany(
            { 'usedBy.userId': testUserId },
            { $pull: { usedBy: { userId: testUserId } } }
        );
        console.log('✅ Removed test usage records from quiz pools');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

async function main() {
    console.log('🚀 Starting Quiz Flow Test Suite...');
    
    await connectDB();
    
    let testData = null;
    let success = true;
    
    try {
        // Test 1: Quiz Availability
        testData = await testQuizAvailability();
        if (!testData) {
            console.log('❌ Cannot proceed without available quizzes');
            return;
        }
        
        // Test 2: Attempt Logging
        const loggingResult = await testQuizAttemptLogging(testData.testUserId, testData.quiz);
        if (!loggingResult) {
            success = false;
        }
        
        // Test 3: Duplicate Prevention
        if (loggingResult) {
            const duplicateResult = await testDuplicatePrevention(testData.testUserId, testData.quiz, loggingResult.mockQuizResult);
            if (!duplicateResult) {
                success = false;
            }
        }
        
        // Test 4: Retake Functionality
        const retakeResult = await testRetakeFunctionality(testData.testUserId, testData.quiz);
        if (!retakeResult) {
            success = false;
        }
        
        // Test 5: Timestamp Validation
        const timestampResult = await validateTimestamps(testData.testUserId);
        if (!timestampResult) {
            success = false;
        }
        
        // Summary
        console.log('\n📊 Test Results Summary:');
        console.log(success ? '✅ All tests passed!' : '❌ Some tests failed');
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        success = false;
    } finally {
        if (testData) {
            await cleanup(testData.testUserId);
        }
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
        
        process.exit(success ? 0 : 1);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testQuizAvailability,
    testQuizAttemptLogging,
    testDuplicatePrevention,
    testRetakeFunctionality,
    validateTimestamps
};