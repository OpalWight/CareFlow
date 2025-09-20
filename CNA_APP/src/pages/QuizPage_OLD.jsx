import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import Layout from '../components/Layout';
import { generateQuizQuestions, submitAnswer, getQuizHistory, retakeQuiz, getQuestionByPosition, getQuizResults } from '../api/quizApi';
import '../styles/QuizPage.css';

const QuizPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [questionError, setQuestionError] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizHistory, setQuizHistory] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [currentQuizId, setCurrentQuizId] = useState(null);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [progress, setProgress] = useState({ correct: 0, incorrect: 0 });
    const [lastAnswerFeedback, setLastAnswerFeedback] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Quiz configuration state
    const [showConfig, setShowConfig] = useState(false);
    const [quizConfig, setQuizConfig] = useState({
        questionCount: 30,
        competencyRatios: {
            physicalCareSkills: 64,
            psychosocialCareSkills: 10,
            roleOfNurseAide: 26
        },
        difficulty: 'intermediate'
    });

    // Load quiz history on component mount
    useEffect(() => {
        const loadQuizHistory = async () => {
            try {
                const historyData = await getQuizHistory(1, 10);
                setQuizHistory(historyData?.quizzes || []);
                setUserStats(historyData?.userStats || null);
            } catch (error) {
                console.error('Error loading quiz history:', error);
                setQuizHistory([]);
                setUserStats(null);
            }
        };
        
        if (user) {
            loadQuizHistory();
        }
    }, [user]);

    // Quiz configuration functions
    const handleQuestionCountChange = (count) => {
        setQuizConfig(prev => ({
            ...prev,
            questionCount: parseInt(count)
        }));
    };

    const handleCompetencyRatioChange = (competency, value) => {
        const newValue = parseInt(value);
        setQuizConfig(prev => {
            const newRatios = { ...prev.competencyRatios };
            const oldValue = newRatios[competency];
            const difference = newValue - oldValue;
            
            newRatios[competency] = newValue;
            
            // Auto-adjust other competencies to maintain 100% total
            const otherKeys = Object.keys(newRatios).filter(key => key !== competency);
            const remaining = 100 - newValue;
            
            if (remaining >= 0) {
                // Distribute the remaining percentage proportionally
                const otherTotal = otherKeys.reduce((sum, key) => sum + newRatios[key], 0);
                
                if (otherTotal > 0) {
                    otherKeys.forEach(key => {
                        const proportion = newRatios[key] / otherTotal;
                        newRatios[key] = Math.round(remaining * proportion);
                    });
                } else {
                    // If other values are 0, distribute equally
                    const equalShare = Math.floor(remaining / otherKeys.length);
                    otherKeys.forEach((key, index) => {
                        newRatios[key] = index === otherKeys.length - 1 ? 
                            remaining - (equalShare * (otherKeys.length - 1)) : equalShare;
                    });
                }
            }
            
            // Ensure minimum values and total adds to 100
            const total = Object.values(newRatios).reduce((sum, val) => sum + val, 0);
            if (total !== 100) {
                const adjustment = 100 - total;
                newRatios[otherKeys[0]] = Math.max(0, newRatios[otherKeys[0]] + adjustment);
            }
            
            return {
                ...prev,
                competencyRatios: newRatios
            };
        });
    };

    const handleDifficultyChange = (difficulty) => {
        setQuizConfig(prev => ({
            ...prev,
            difficulty
        }));
    };

    const getQuestionDistribution = () => {
        const { questionCount, competencyRatios } = quizConfig;
        return {
            physicalCare: Math.round((competencyRatios.physicalCareSkills / 100) * questionCount),
            psychosocialCare: Math.round((competencyRatios.psychosocialCareSkills / 100) * questionCount),
            roleOfAide: Math.round((competencyRatios.roleOfNurseAide / 100) * questionCount)
        };
    };

    const startQuiz = async () => {
        setIsLoading(true);
        setLastAnswerFeedback(null);
        setQuizStarted(true);
        try {
            const quizData = await generateQuizQuestions(quizConfig);
            setCurrentQuizId(quizData.sessionId);
            setTotalQuestions(quizData.totalQuestions);
            if (quizData.currentQuestion) {
                setQuestions([quizData.currentQuestion]);
                setCurrentQuestionIndex(0);
            } else {
                setQuestions([]);
                setQuestionError("Failed to load the first question.");
            }
        } catch (error) {
            console.error('Error generating quiz questions:', error);
            setQuestionError("Failed to start the quiz. Please try again.");
            setQuizStarted(false);
        }
        setIsLoading(false);
    };

    const handleAnswerSelect = (selectedOption) => {
        if (lastAnswerFeedback) return;
        setCurrentAnswer(selectedOption);
    };

    const handleSubmitAnswer = async () => {
        if (currentAnswer === null) {
            setQuestionError("Please select an answer.");
            return;
        }

        setIsSubmitting(true);
        setQuestionError(null);

        const currentQuestion = questions[currentQuestionIndex];

        try {
            const result = await submitAnswer(
                currentQuizId,
                currentQuestion.questionId,
                currentAnswer,
                10 // Placeholder for timeSpent
            );

            setLastAnswerFeedback({
                isCorrect: result.isCorrect,
                correctAnswer: result.correctAnswer,
                explanation: result.explanation,
                question: currentQuestion.question
            });

            setProgress(prev => ({
                correct: prev.correct + (result.isCorrect ? 1 : 0),
                incorrect: prev.incorrect + (result.isCorrect ? 0 : 1)
            }));

            if (result.quizComplete) {
                const finalResults = await getQuizResults(currentQuizId);
                setResultData(finalResults);
                setShowResults(true);
            } else {
                setQuestions(prev => [...prev, result.nextQuestion]);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            setQuestionError("Failed to submit answer. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const goToNextQuestion = () => {
        setLastAnswerFeedback(null);
        setCurrentAnswer(null);
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    };

    const resetQuiz = () => {
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setCurrentAnswer(null);
        setShowResults(false);
        setQuizStarted(false);
        setResultData(null);
        setCurrentQuizId(null);
        setTotalQuestions(0);
        setProgress({ correct: 0, incorrect: 0 });
        setLastAnswerFeedback(null);
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
                                <p>This quiz contains {quizConfig.questionCount} questions based on the national standards of CNA certification.</p>
                                <ul>
                                    <li>Multiple choice format (A, B, C, D)</li>
                                    <li>Questions cover all essential CNA competencies</li>
                                    <li>You can navigate between questions</li>
                                    <li>Complete all questions to see your results</li>
                                </ul>
                            </div>

                            {showConfig && (
                                <div className="quiz-configuration">
                                    <h3>🎛️ Quiz Settings</h3>
                                    
                                    {/* Question Count Slider */}
                                    <div className="setting-group">
                                        <label htmlFor="questionCount">
                                            Quiz Length: <strong>{quizConfig.questionCount} questions</strong>
                                        </label>
                                        <input 
                                            id="questionCount"
                                            type="range" 
                                            min="10" 
                                            max="50" 
                                            value={quizConfig.questionCount}
                                            onChange={(e) => handleQuestionCountChange(e.target.value)}
                                            className="slider question-count-slider"
                                        />
                                        <div className="slider-labels">
                                            <span>10</span>
                                            <span>30</span>
                                            <span>50</span>
                                        </div>
                                    </div>

                                    {/* Content Focus Sliders */}
                                    <div className="setting-group">
                                        <label>📚 Content Focus</label>
                                        <div className="competency-sliders">
                                            <div className="competency-item">
                                                <div className="competency-header">
                                                    <span>Physical Care Skills</span>
                                                    <strong>{quizConfig.competencyRatios.physicalCareSkills}%</strong>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={quizConfig.competencyRatios.physicalCareSkills}
                                                    onChange={(e) => handleCompetencyRatioChange('physicalCareSkills', e.target.value)}
                                                    className="slider competency-slider physical-care"
                                                />
                                            </div>
                                            
                                            <div className="competency-item">
                                                <div className="competency-header">
                                                    <span>Psychosocial Care Skills</span>
                                                    <strong>{quizConfig.competencyRatios.psychosocialCareSkills}%</strong>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={quizConfig.competencyRatios.psychosocialCareSkills}
                                                    onChange={(e) => handleCompetencyRatioChange('psychosocialCareSkills', e.target.value)}
                                                    className="slider competency-slider psychosocial-care"
                                                />
                                            </div>
                                            
                                            <div className="competency-item">
                                                <div className="competency-header">
                                                    <span>Role of the Nurse Aide</span>
                                                    <strong>{quizConfig.competencyRatios.roleOfNurseAide}%</strong>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={quizConfig.competencyRatios.roleOfNurseAide}
                                                    onChange={(e) => handleCompetencyRatioChange('roleOfNurseAide', e.target.value)}
                                                    className="slider competency-slider nurse-aide"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Difficulty Level */}
                                    <div className="setting-group">
                                        <label htmlFor="difficulty">🎯 Difficulty Level</label>
                                        <select 
                                            id="difficulty"
                                            value={quizConfig.difficulty}
                                            onChange={(e) => handleDifficultyChange(e.target.value)}
                                            className="difficulty-select"
                                        >
                                            <option value="beginner">🟢 Beginner</option>
                                            <option value="intermediate">🟡 Intermediate</option>
                                            <option value="advanced">🔴 Advanced</option>
                                        </select>
                                    </div>

                                    {/* Question Distribution Preview */}
                                    <div className="setting-group">
                                        <label>📊 Question Distribution Preview</label>
                                        <div className="distribution-preview">
                                            {(() => {
                                                const distribution = getQuestionDistribution();
                                                return (
                                                    <>
                                                        <div className="distribution-item">
                                                            <span className="distribution-color physical-care"></span>
                                                            <span>Physical Care: {distribution.physicalCare} questions</span>
                                                        </div>
                                                        <div className="distribution-item">
                                                            <span className="distribution-color psychosocial-care"></span>
                                                            <span>Psychosocial Care: {distribution.psychosocialCare} questions</span>
                                                        </div>
                                                        <div className="distribution-item">
                                                            <span className="distribution-color nurse-aide"></span>
                                                            <span>Role of Nurse Aide: {distribution.roleOfAide} questions</span>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="quiz-actions">
                                <button 
                                    onClick={startQuiz} 
                                    className="start-quiz-btn"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Generating Questions...' : 'Start Quiz'}
                                </button>
                                <button 
                                    onClick={() => setShowConfig(!showConfig)} 
                                    className="customize-quiz-btn"
                                >
                                    {showConfig ? '🔙 Hide Settings' : '⚙️ Customize Quiz'}
                                </button>
                                {quizHistory && quizHistory.length > 0 && (
                                    <button 
                                        onClick={() => setShowHistory(true)} 
                                        className="view-history-btn"
                                    >
                                        View Quiz History ({quizHistory?.length || 0})
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
                            {quizHistory?.map((quiz, index) => (
                                <div key={quiz.id} className="history-item">
                                    <div className="history-main">
                                        <div className="history-score">
                                            <span className="score">{quiz.score}/30</span>
                                            <span className="percentage">({quiz.percentage}%)</span>
                                        </div>
                                        <div className="history-details">
                                            <div className="attempt-number">Attempt #{(quizHistory?.length || 0) - index}</div>
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

                        {isLoadingQuestion ? (
                            <div className="question-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading question...</p>
                            </div>
                        ) : questionError ? (
                            <div className="question-error">
                                <p>⚠️ {questionError}</p>
                                <button onClick={retryLoadQuestion} className="retry-btn">
                                    🔄 Retry
                                </button>
                            </div>
                        ) : currentQuestion ? (
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
                                                disabled={isLoadingQuestion}
                                            />
                                            <span className="option-letter">{option}</span>
                                            <span className="option-text">{currentQuestion.options[option]}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="question-error">
                                <p>⚠️ Question not available. Please try navigating to another question.</p>
                            </div>
                        )}

                        <div className="quiz-navigation">
                            <button 
                                onClick={goToPreviousQuestion}
                                disabled={currentQuestionIndex === 0 || isLoadingQuestion}
                                className="nav-btn prev-btn"
                            >
                                {isLoadingQuestion ? 'Loading...' : 'Previous'}
                            </button>
                            
                            {isLastQuestion && allQuestionsAnswered ? (
                                <button 
                                    onClick={submitQuiz} 
                                    disabled={isLoadingQuestion}
                                    className="submit-btn"
                                >
                                    Submit Quiz
                                </button>
                            ) : (
                                <button 
                                    onClick={goToNextQuestion}
                                    disabled={isLastQuestion || isLoadingQuestion}
                                    className="nav-btn next-btn"
                                >
                                    {isLoadingQuestion ? 'Loading...' : 'Next'}
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