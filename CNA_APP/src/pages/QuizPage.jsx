import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import Layout from '../components/Layout';
import { generateQuizQuestions, submitQuizResults, getQuizHistory, retakeQuiz } from '../api/quizApi';
import '../styles/QuizPage.css';

const QuizPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [timeStarted, setTimeStarted] = useState(null);
    const [quizHistory, setQuizHistory] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [comparison, setComparison] = useState(null);
    const [competencyInsights, setCompetencyInsights] = useState(null);
    const [isRetake, setIsRetake] = useState(false);
    const [originalQuizId, setOriginalQuizId] = useState(null);
    const [resultData, setResultData] = useState(null);
    const [currentQuizId, setCurrentQuizId] = useState(null);

    // Load quiz history on component mount
    useEffect(() => {
        const loadQuizHistory = async () => {
            try {
                const historyData = await getQuizHistory(1, 10);
                setQuizHistory(historyData.quizzes);
                setUserStats(historyData.userStats);
            } catch (error) {
                console.error('Error loading quiz history:', error);
            }
        };
        
        if (user) {
            loadQuizHistory();
        }
    }, [user]);

    const startQuiz = async () => {
        setIsLoading(true);
        try {
            const quizData = await generateQuizQuestions();
            setQuestions(quizData.questions);
            setCurrentQuizId(quizData.quizId);
            setQuizStarted(true);
            setTimeStarted(new Date());
            setIsRetake(false);
            setOriginalQuizId(null);
        } catch (error) {
            console.error('Error generating quiz questions:', error);
        }
        setIsLoading(false);
    };

    const startRetake = async (quizId) => {
        setIsLoading(true);
        try {
            const retakeData = await retakeQuiz(quizId);
            setQuestions(retakeData.questions);
            setCurrentQuizId(`retake_${quizId}_${Date.now()}`);
            setQuizStarted(true);
            setTimeStarted(new Date());
            setIsRetake(true);
            setOriginalQuizId(quizId);
            setShowHistory(false);
        } catch (error) {
            console.error('Error setting up quiz retake:', error);
        }
        setIsLoading(false);
    };

    const handleAnswerSelect = (questionIndex, selectedOption) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionIndex]: selectedOption
        }));
    };

    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const submitQuiz = async () => {
        setIsLoading(true);
        try {
            const results = await submitQuizResults(
                selectedAnswers,
                currentQuizId,
                timeStarted,
                isRetake ? originalQuizId : null
            );
            
            setScore(results.score);
            setComparison(results.comparison);
            setCompetencyInsights(results.competencyInsights);
            setResultData(results);
            setShowResults(true);
            
            // Refresh quiz history
            const updatedHistory = await getQuizHistory(1, 10);
            setQuizHistory(updatedHistory.quizzes);
            setUserStats(updatedHistory.userStats);
            
        } catch (error) {
            console.error('Error submitting quiz:', error);
            // Fallback to local scoring
            let correctCount = 0;
            questions.forEach((question, index) => {
                if (selectedAnswers[index] === question.correctAnswer) {
                    correctCount++;
                }
            });
            setScore(correctCount);
            setShowResults(true);
        }
        setIsLoading(false);
    };

    const resetQuiz = () => {
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setQuizStarted(false);
        setTimeStarted(null);
        setComparison(null);
        setCompetencyInsights(null);
        setIsRetake(false);
        setOriginalQuizId(null);
        setResultData(null);
        setCurrentQuizId(null);
        setShowHistory(false);
    };

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const allQuestionsAnswered = Object.keys(selectedAnswers).length === questions.length;

    if (!user) {
        return (
            <Layout className="quiz-page">
                <div className="error-container">
                    <h2>Please Log In</h2>
                    <p>You must be logged in to take the CNA certification quiz.</p>
                    <button onClick={() => window.location.href = '/login'} className="login-btn">
                        Go to Login
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout className="quiz-page">
            <div className="quiz-container">
                {!quizStarted && !showHistory ? (
                    <>
                        <div className="quiz-intro">
                            <h1>CNA Certification Practice Quiz</h1>
                            <div className="quiz-info">
                                <p>This quiz contains 30 questions based on the national standards of CNA certification.</p>
                                <ul>
                                    <li>Multiple choice format (A, B, C, D)</li>
                                    <li>Questions cover all essential CNA competencies</li>
                                    <li>You can navigate between questions</li>
                                    <li>Complete all questions to see your results</li>
                                </ul>
                            </div>
                            <div className="quiz-actions">
                                <button 
                                    onClick={startQuiz} 
                                    className="start-quiz-btn"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Generating Questions...' : 'Start New Quiz'}
                                </button>
                                {quizHistory.length > 0 && (
                                    <button 
                                        onClick={() => setShowHistory(true)} 
                                        className="view-history-btn"
                                    >
                                        View Quiz History ({quizHistory.length})
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {userStats && (
                            <div className="user-stats">
                                <h3>Your Statistics</h3>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <span className="stat-value">{userStats.totalAttempts}</span>
                                        <span className="stat-label">Total Attempts</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{userStats.bestScore}/30</span>
                                        <span className="stat-label">Best Score</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{Math.round((userStats.bestScore / 30) * 100)}%</span>
                                        <span className="stat-label">Best Percentage</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{userStats.averageScore}/30</span>
                                        <span className="stat-label">Average Score</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : showHistory ? (
                    <div className="quiz-history">
                        <div className="history-header">
                            <h2>Quiz History</h2>
                            <button onClick={() => setShowHistory(false)} className="back-btn">← Back</button>
                        </div>
                        <div className="history-list">
                            {quizHistory.map((quiz, index) => (
                                <div key={quiz.id} className="history-item">
                                    <div className="history-main">
                                        <div className="history-score">
                                            <span className="score">{quiz.score}/30</span>
                                            <span className="percentage">({quiz.percentage}%)</span>
                                        </div>
                                        <div className="history-details">
                                            <div className="attempt-number">Attempt #{quizHistory.length - index}</div>
                                            <div className="date">{new Date(quiz.date).toLocaleDateString()}</div>
                                            <div className="duration">{quiz.durationMinutes}min</div>
                                            {quiz.isRetake && <span className="retake-badge">Retake</span>}
                                        </div>
                                    </div>
                                    <div className="history-actions">
                                        <button 
                                            onClick={() => navigate(`/quiz/results/${quiz.id}`)} 
                                            className="view-results-btn"
                                        >
                                            📋 View Results
                                        </button>
                                        <button 
                                            onClick={() => startRetake(quiz.id)} 
                                            className="retake-btn"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Setting up...' : 'Retake'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : showResults ? (
                    <div className="quiz-results">
                        <h2>Quiz Results</h2>
                        <div className="score-display">
                            <div className="score-circle">
                                <span className="score-number">{score}</span>
                                <span className="score-total">/ {questions.length}</span>
                            </div>
                            <div className="score-percentage">
                                {Math.round((score / questions.length) * 100)}%
                            </div>
                        </div>
                        
                        {/* Show comparison if available */}
                        {comparison && !comparison.isFirstAttempt && (
                            <div className="improvement-section">
                                <h3>Progress Tracking</h3>
                                <div className="improvement-stats">
                                    {comparison.improvement > 0 ? (
                                        <div className="improvement-positive">
                                            <span className="improvement-icon">📈</span>
                                            <span>Improved by {comparison.improvement} points!</span>
                                        </div>
                                    ) : comparison.improvement < 0 ? (
                                        <div className="improvement-negative">
                                            <span className="improvement-icon">📉</span>
                                            <span>Score decreased by {Math.abs(comparison.improvement)} points</span>
                                        </div>
                                    ) : (
                                        <div className="improvement-neutral">
                                            <span className="improvement-icon">📊</span>
                                            <span>Same score as last attempt</span>
                                        </div>
                                    )}
                                    
                                    {comparison.isNewPersonalBest && (
                                        <div className="personal-best">
                                            <span className="best-icon">🏆</span>
                                            <span>New Personal Best!</span>
                                        </div>
                                    )}
                                    
                                    <div className="comparison-stats">
                                        <div>Best: {comparison.bestScore}/30</div>
                                        <div>Average: {comparison.averageScore}/30</div>
                                        <div>Attempts: {comparison.previousAttempts + 1}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="score-interpretation">
                            {score >= 24 ? (
                                <div className="score-excellent">
                                    <h3>🎉 Excellent!</h3>
                                    <p>You demonstrated strong knowledge of CNA competencies.</p>
                                </div>
                            ) : score >= 18 ? (
                                <div className="score-good">
                                    <h3>👍 Good Job!</h3>
                                    <p>You have a solid understanding with some areas for improvement.</p>
                                </div>
                            ) : (
                                <div className="score-needs-improvement">
                                    <h3>📚 Keep Studying</h3>
                                    <p>Consider reviewing CNA materials and taking the quiz again.</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Show competency insights if available */}
                        {competencyInsights && (
                            <div className="competency-insights">
                                <h3>Competency Analysis</h3>
                                {competencyInsights.strengths.length > 0 && (
                                    <div className="strengths">
                                        <h4>💪 Strong Areas:</h4>
                                        <ul>
                                            {competencyInsights.strengths.map((strength, i) => (
                                                <li key={i}>{strength}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {competencyInsights.weaknesses.length > 0 && (
                                    <div className="weaknesses">
                                        <h4>📚 Areas for Improvement:</h4>
                                        <ul>
                                            {competencyInsights.weaknesses.map((weakness, i) => (
                                                <li key={i}>{weakness}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="quiz-actions">
                            {resultData && resultData.quizId && (
                                <button 
                                    onClick={() => navigate(`/quiz/results/${resultData.quizId}`)} 
                                    className="view-details-btn"
                                >
                                    📋 View Detailed Results
                                </button>
                            )}
                            <button onClick={resetQuiz} className="retake-quiz-btn">
                                Take New Quiz
                            </button>
                            <button onClick={() => setShowHistory(true)} className="view-history-btn">
                                View History
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="quiz-content">
                        <div className="quiz-header">
                            <div className="quiz-progress">
                                <span className="question-number">
                                    Question {currentQuestionIndex + 1} of {questions.length}
                                </span>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {currentQuestion && (
                            <div className="question-container">
                                <h3 className="question-text">{currentQuestion.question}</h3>
                                <div className="options-container">
                                    {['A', 'B', 'C', 'D'].map((option) => (
                                        <label 
                                            key={option}
                                            className={`option-label ${selectedAnswers[currentQuestionIndex] === option ? 'selected' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${currentQuestionIndex}`}
                                                value={option}
                                                checked={selectedAnswers[currentQuestionIndex] === option}
                                                onChange={() => handleAnswerSelect(currentQuestionIndex, option)}
                                            />
                                            <span className="option-letter">{option}</span>
                                            <span className="option-text">{currentQuestion.options[option]}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="quiz-navigation">
                            <button 
                                onClick={goToPreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="nav-btn prev-btn"
                            >
                                Previous
                            </button>
                            
                            {isLastQuestion && allQuestionsAnswered ? (
                                <button onClick={submitQuiz} className="submit-btn">
                                    Submit Quiz
                                </button>
                            ) : (
                                <button 
                                    onClick={goToNextQuestion}
                                    disabled={isLastQuestion}
                                    className="nav-btn next-btn"
                                >
                                    Next
                                </button>
                            )}
                        </div>

                        <div className="quiz-summary">
                            <p>Answered: {Object.keys(selectedAnswers).length} / {questions.length}</p>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default QuizPage;