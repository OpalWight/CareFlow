const { GoogleGenerativeAI } = require('@google/generative-ai');
const QuizResult = require('../models/QuizResult');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CNA competency areas for comprehensive quiz generation
const CNA_COMPETENCIES = [
    "Basic Nursing Skills",
    "Personal Care Skills", 
    "Mental Health and Social Service Needs",
    "Care of Cognitively Impaired Residents",
    "Basic Restorative Services",
    "Resident Rights",
    "Communication and Interpersonal Skills",
    "Infection Control",
    "Safety/Emergency Procedures",
    "Promoting Residents' Independence"
];

// Generate 30 CNA certification quiz questions
exports.generateQuizQuestions = async (req, res) => {
    try {
        const { questionCount = 30, topic = 'CNA_CERTIFICATION' } = req.body;
        
        console.log(`🧠 Generating ${questionCount} CNA quiz questions...`);
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });
        
        const prompt = `Generate exactly ${questionCount} CNA (Certified Nursing Assistant) certification exam questions based on the national standards and competency areas.

COMPETENCY AREAS TO COVER:
${CNA_COMPETENCIES.map((comp, i) => `${i + 1}. ${comp}`).join('\n')}

REQUIREMENTS:
- Each question must be multiple choice with exactly 4 options (A, B, C, D)
- Questions should reflect real CNA certification exam difficulty
- Cover all competency areas proportionally 
- Include both knowledge-based and application-based questions
- Questions must be realistic scenarios CNAs encounter
- One correct answer per question
- Incorrect options should be plausible but clearly wrong to knowledgeable CNAs

STRICT JSON FORMAT - Return ONLY valid JSON array:
[
  {
    "question": "Question text here",
    "options": {
      "A": "Option A text",
      "B": "Option B text", 
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A",
    "competencyArea": "Basic Nursing Skills",
    "explanation": "Brief explanation of why this is correct"
  }
]

Generate exactly ${questionCount} questions. Return ONLY the JSON array, no other text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let generatedText = response.text();
        
        console.log('🤖 Raw AI Response (first 200 chars):', generatedText.substring(0, 200) + '...');
        
        // Clean up the response to extract JSON
        generatedText = generatedText.trim();
        
        // Remove markdown code blocks if present
        if (generatedText.startsWith('```json')) {
            generatedText = generatedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (generatedText.startsWith('```')) {
            generatedText = generatedText.replace(/```\n?/, '').replace(/\n?```$/, '');
        }
        
        let questions;
        try {
            questions = JSON.parse(generatedText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            console.error('Attempting to fix JSON formatting...');
            
            // Try to fix common JSON issues
            let fixedText = generatedText
                .replace(/([^,\]\}])\s*\n\s*([{\[])/g, '$1,$2') // Add missing commas
                .replace(/,\s*\]/g, ']') // Remove trailing commas in arrays
                .replace(/,\s*\}/g, '}'); // Remove trailing commas in objects
            
            try {
                questions = JSON.parse(fixedText);
            } catch (secondParseError) {
                console.error('❌ Failed to fix JSON. Generating fallback questions...');
                questions = generateFallbackQuestions(questionCount);
            }
        }
        
        // Validate the questions structure
        if (!Array.isArray(questions) || questions.length === 0) {
            console.error('❌ Invalid questions array, using fallback');
            questions = generateFallbackQuestions(questionCount);
        }
        
        // Ensure we have the right number of questions
        if (questions.length !== questionCount) {
            console.log(`⚠️  Expected ${questionCount} questions, got ${questions.length}. Adjusting...`);
            if (questions.length < questionCount) {
                // Add fallback questions to reach target
                const needed = questionCount - questions.length;
                const fallbackQuestions = generateFallbackQuestions(needed);
                questions = [...questions, ...fallbackQuestions];
            } else {
                // Trim to target count
                questions = questions.slice(0, questionCount);
            }
        }
        
        console.log(`✅ Successfully generated ${questions.length} quiz questions`);
        
        res.json({
            questions: questions,
            totalQuestions: questions.length,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error generating quiz questions:', error);
        
        // Return fallback questions on error
        const fallbackQuestions = generateFallbackQuestions(req.body.questionCount || 30);
        res.status(200).json({
            questions: fallbackQuestions,
            totalQuestions: fallbackQuestions.length,
            generatedAt: new Date().toISOString(),
            fallback: true
        });
    }
};

// Submit quiz results for scoring and feedback
exports.submitQuizResults = async (req, res) => {
    try {
        const { answers, questions, timeStarted, originalQuizId } = req.body;
        const userId = req.user.id;
        
        if (!answers || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ message: 'Invalid quiz submission data' });
        }
        
        // Calculate score and detailed results
        let correctCount = 0;
        const processedQuestions = [];
        
        questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            if (isCorrect) {
                correctCount++;
            }
            
            processedQuestions.push({
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                userAnswer: userAnswer,
                isCorrect: isCorrect,
                competencyArea: question.competencyArea,
                explanation: question.explanation
            });
        });
        
        const score = correctCount;
        const percentage = Math.round((score / questions.length) * 100);
        const timeCompleted = new Date();
        const startTime = timeStarted ? new Date(timeStarted) : new Date(timeCompleted.getTime() - 30 * 60 * 1000); // Default 30 min if not provided
        const durationMinutes = Math.round((timeCompleted - startTime) / (1000 * 60));
        
        // Generate competency analysis
        const competencyAnalysis = analyzeCompetencyPerformance(processedQuestions.map((q, index) => ({
            questionIndex: index,
            question: q.question,
            userAnswer: q.userAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect: q.isCorrect,
            competencyArea: q.competencyArea,
            explanation: q.explanation
        })));
        
        // Get user's previous attempts for comparison
        const previousAttempts = await QuizResult.find({ userId }).sort({ createdAt: -1 });
        
        // Create and save quiz result
        const quizResult = new QuizResult({
            userId,
            questions: processedQuestions,
            score,
            totalQuestions: questions.length,
            percentage,
            competencyAnalysis: new Map(Object.entries(competencyAnalysis)),
            timeStarted: startTime,
            timeCompleted,
            durationMinutes,
            isRetake: !!originalQuizId,
            originalQuizId: originalQuizId || null,
            metadata: {
                deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
                browserInfo: req.get('User-Agent'),
                ipAddress: req.ip
            }
        });
        
        await quizResult.save();
        console.log(`✅ Quiz result saved for user ${userId}: ${score}/${questions.length} (${percentage}%)`);
        
        // Generate comparison with previous attempts
        const comparison = quizResult.compareWithPrevious(previousAttempts);
        const competencyInsights = quizResult.getCompetencyInsights();
        
        res.json({
            quizId: quizResult._id,
            score,
            totalQuestions: questions.length,
            percentage,
            detailedResults: processedQuestions.map((q, index) => ({
                questionIndex: index,
                question: q.question,
                userAnswer: q.userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect: q.isCorrect,
                competencyArea: q.competencyArea,
                explanation: q.explanation
            })),
            competencyAnalysis,
            competencyInsights,
            comparison,
            durationMinutes,
            submittedAt: timeCompleted.toISOString(),
            attemptNumber: previousAttempts.length + 1
        });
        
    } catch (error) {
        console.error('Error submitting quiz results:', error);
        res.status(500).json({ message: 'Error processing quiz results' });
    }
};

// Analyze performance by competency area
function analyzeCompetencyPerformance(results) {
    const competencyStats = {};
    
    results.forEach(result => {
        const competency = result.competencyArea;
        if (!competencyStats[competency]) {
            competencyStats[competency] = {
                total: 0,
                correct: 0,
                percentage: 0
            };
        }
        
        competencyStats[competency].total++;
        if (result.isCorrect) {
            competencyStats[competency].correct++;
        }
    });
    
    // Calculate percentages
    Object.keys(competencyStats).forEach(competency => {
        const stats = competencyStats[competency];
        stats.percentage = Math.round((stats.correct / stats.total) * 100);
    });
    
    return competencyStats;
}

// Fallback questions in case AI generation fails
function generateFallbackQuestions(count) {
    const fallbackQuestions = [
        {
            question: "What is the most important step before providing any care to a resident?",
            options: {
                A: "Check the care plan",
                B: "Wash your hands",
                C: "Introduce yourself and explain the procedure", 
                D: "Put on gloves"
            },
            correctAnswer: "B",
            competencyArea: "Infection Control",
            explanation: "Hand hygiene is the most important infection control measure and should be done before any patient contact."
        },
        {
            question: "When should a CNA report changes in a resident's condition?",
            options: {
                A: "Only during shift change",
                B: "At the end of the week",
                C: "Immediately when noticed",
                D: "Only if the family asks"
            },
            correctAnswer: "C",
            competencyArea: "Communication and Interpersonal Skills",
            explanation: "Any changes in a resident's condition should be reported immediately to ensure prompt medical attention."
        },
        {
            question: "What is the proper way to lift a heavy object?",
            options: {
                A: "Bend at the waist and lift with your back",
                B: "Use your legs and keep your back straight",
                C: "Twist your body while lifting",
                D: "Lift as quickly as possible"
            },
            correctAnswer: "B",
            competencyArea: "Safety/Emergency Procedures", 
            explanation: "Proper body mechanics require using leg muscles and keeping the back straight to prevent injury."
        },
        {
            question: "A resident has the right to:",
            options: {
                A: "Only basic care",
                B: "Privacy and dignity",
                C: "Limited visitors",
                D: "No personal belongings"
            },
            correctAnswer: "B",
            competencyArea: "Resident Rights",
            explanation: "All residents have the fundamental right to privacy and dignity in their care."
        },
        {
            question: "When assisting with feeding, you should:",
            options: {
                A: "Feed the resident as quickly as possible",
                B: "Only offer liquids",
                C: "Allow the resident to eat at their own pace",
                D: "Force the resident to finish everything"
            },
            correctAnswer: "C",
            competencyArea: "Basic Nursing Skills",
            explanation: "Residents should be allowed to eat at their own comfortable pace to prevent choking and promote dignity."
        }
    ];
    
    // Repeat and vary the fallback questions to reach the desired count
    const questions = [];
    for (let i = 0; i < count; i++) {
        const baseQuestion = fallbackQuestions[i % fallbackQuestions.length];
        questions.push({
            ...baseQuestion,
            question: `${baseQuestion.question}${i >= fallbackQuestions.length ? ` (Question ${i + 1})` : ''}`
        });
    }
    
    return questions.slice(0, count);
}

// Get user's quiz history
exports.getQuizHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10, page = 1 } = req.query;
        
        const skip = (page - 1) * limit;
        
        // Get paginated quiz history
        const quizzes = await QuizResult.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('score totalQuestions percentage createdAt durationMinutes isRetake competencyAnalysis');
        
        // Get total count for pagination
        const totalCount = await QuizResult.countDocuments({ userId });
        
        // Get user statistics
        const userStats = await QuizResult.getUserStats(userId);
        
        res.json({
            quizzes: quizzes.map(quiz => ({
                id: quiz._id,
                score: quiz.score,
                totalQuestions: quiz.totalQuestions,
                percentage: quiz.percentage,
                date: quiz.createdAt,
                durationMinutes: quiz.durationMinutes,
                isRetake: quiz.isRetake,
                competencyAnalysis: Object.fromEntries(quiz.competencyAnalysis)
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            },
            userStats
        });
        
    } catch (error) {
        console.error('Error getting quiz history:', error);
        res.status(500).json({ message: 'Error retrieving quiz history' });
    }
};

// Get specific quiz details for review/retake
exports.getQuizDetails = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        
        const quiz = await QuizResult.findOne({ _id: quizId, userId });
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        // Get previous attempts for comparison
        const previousAttempts = await QuizResult.find({ 
            userId, 
            createdAt: { $lt: quiz.createdAt } 
        }).sort({ createdAt: -1 });
        
        const comparison = quiz.compareWithPrevious(previousAttempts);
        const competencyInsights = quiz.getCompetencyInsights();
        
        res.json({
            quiz: {
                id: quiz._id,
                score: quiz.score,
                totalQuestions: quiz.totalQuestions,
                percentage: quiz.percentage,
                questions: quiz.questions,
                timeStarted: quiz.timeStarted,
                timeCompleted: quiz.timeCompleted,
                durationMinutes: quiz.durationMinutes,
                isRetake: quiz.isRetake,
                competencyAnalysis: Object.fromEntries(quiz.competencyAnalysis),
                createdAt: quiz.createdAt
            },
            comparison,
            competencyInsights
        });
        
    } catch (error) {
        console.error('Error getting quiz details:', error);
        res.status(500).json({ message: 'Error retrieving quiz details' });
    }
};

// Retake a previous quiz (with same questions)
exports.retakeQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        
        const originalQuiz = await QuizResult.findOne({ _id: quizId, userId });
        
        if (!originalQuiz) {
            return res.status(404).json({ message: 'Original quiz not found' });
        }
        
        // Return the same questions for retaking
        const questions = originalQuiz.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            competencyArea: q.competencyArea,
            explanation: q.explanation
        }));
        
        res.json({
            questions: questions,
            totalQuestions: questions.length,
            originalQuizId: quizId,
            originalScore: originalQuiz.score,
            originalPercentage: originalQuiz.percentage,
            retakeOf: originalQuiz.createdAt
        });
        
    } catch (error) {
        console.error('Error setting up quiz retake:', error);
        res.status(500).json({ message: 'Error setting up quiz retake' });
    }
};