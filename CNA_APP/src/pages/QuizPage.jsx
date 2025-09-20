import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import Layout from '../components/Layout';
import { generateQuizQuestions, submitQuizResults, getQuizHistory, retakeQuiz, getQuestionByPosition, submitInstantAnswer, getUserPreferences, updateUserPreferences } from '../api/quizApi';
import '../styles/QuizPage.css';

const QuizPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
    const [questionError, setQuestionError] = useState(null);
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
    
    // Instant grading state
    const [userPreferences, setUserPreferences] = useState(null);
    const [instantGradingEnabled, setInstantGradingEnabled] = useState(false);
    const [instantFeedback, setInstantFeedback] = useState({});
    const [questionStartTime, setQuestionStartTime] = useState(null);
    
    // Quiz configuration state
    const [showConfig, setShowConfig] = useState(false);
    const [quizConfig, setQuizConfig] = useState({
        questionCount: 30,
        competencyRatios: {
            physicalCareSkills: 64,
            psychosocialCareSkills: 10,
            roleOfNurseAide: 26
        },
        difficulty: 'intermediate',
        instantGrading: false
    });

    // Load quiz history and user preferences on component mount
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
        
        const loadUserPreferences = async () => {
            try {
                const prefsData = await getUserPreferences();
                setUserPreferences(prefsData.preferences);
                const instantGradingPref = prefsData.preferences?.uiPreferences?.instantGrading || false;
                setInstantGradingEnabled(instantGradingPref);
                
                // Update quiz config with saved preference
                setQuizConfig(prev => ({
                    ...prev,
                    instantGrading: instantGradingPref
                }));
            } catch (error) {
                console.error('Error loading user preferences:', error);
                setInstantGradingEnabled(false);
            }
        };
        
        if (user) {
            loadQuizHistory();
            loadUserPreferences();

        }
      } else {
        throw new Error('Invalid quiz response format');
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      setQuestionError('Failed to start quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


    // Set question start time when question changes
    useEffect(() => {
        if (quizStarted && questions[currentQuestionIndex]) {
            setQuestionStartTime(Date.now());
        }
    }, [currentQuestionIndex, quizStarted, questions]);

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
        return newAnswers;
      });
      setCurrentAnswer(selectedOption);
      console.log('✅ Answer stored locally for complete mode - NO GRADING');
    } else {
      // Immediate mode: only allow if no feedback yet
      if (!lastAnswerFeedback) {
        setCurrentAnswer(selectedOption);
        console.log('✅ Answer set for immediate mode');
      } else {
        console.log('⏸️ Answer selection blocked - feedback already shown');
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer || !currentQuizId || !currentQuestion) return;

    const handleInstantGradingChange = async (enabled) => {
        setQuizConfig(prev => ({
            ...prev,
            instantGrading: enabled
        }));
        setInstantGradingEnabled(enabled);

        // Save preference to backend
        try {
            await updateUserPreferences({
                uiPreferences: {
                    instantGrading: enabled
                }
            });
        } catch (error) {
            console.error('Error saving instant grading preference:', error);
        }
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
        try {
            const quizData = await generateQuizQuestions(quizConfig);
            // Handle new session-based API format
            setCurrentQuizId(quizData.sessionId || quizData.quizId);
            
            // Build questions array with first question
            if (quizData.currentQuestion) {
                const questionsArray = new Array(quizData.totalQuestions);
                questionsArray[0] = quizData.currentQuestion;
                setQuestions(questionsArray);
            } else {
                setQuestions(quizData.questions || []);
            }
            
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

    const handleAnswerSelect = async (questionIndex, selectedOption) => {
        // Update selected answers
        setSelectedAnswers(prev => ({
            ...prev,
            [questionIndex]: selectedOption
        }));

        // Handle instant grading if enabled
        if (instantGradingEnabled && currentQuizId && questions[questionIndex]) {
            try {
                const timeSpent = questionStartTime ? Math.round((Date.now() - questionStartTime) / 1000) : 0;
                const feedback = await submitInstantAnswer(
                    currentQuizId,
                    questions[questionIndex].questionId,
                    selectedOption,
                    timeSpent
                );
                
                // Store feedback for this question
                setInstantFeedback(prev => ({
                    ...prev,
                    [questionIndex]: feedback
                }));
            } catch (error) {
                console.error('Error getting instant feedback:', error);
                // Continue without feedback if there's an error
            }
        }
    };


      setProgress(prev => ({
        correct: prev.correct + (result.isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (result.isCorrect ? 0 : 1)
      }));

      console.log('🔍 DEBUG: Submit answer result:', { 
        quizComplete: result.quizComplete, 
        hasNextQuestion: !!result.nextQuestion,
        nextQuestionId: result.nextQuestion?.questionId 
      });

      if (result.quizComplete) {
        const finalResults = await getQuizResults(currentQuizId);
        setResultData(finalResults);
        setShowResults(true);
      } else {
        console.log('🔍 DEBUG: Adding nextQuestion to questions array:', {
          nextQuestion: result.nextQuestion,
          currentQuestionsLength: questions.length,
          currentQuestionIndex
        });
        
        if (result.nextQuestion) {
          setQuestions(prev => {
            const newQuestions = [...prev, result.nextQuestion];
            console.log('🔍 DEBUG: Questions array updated:', {
              oldLength: prev.length,
              newLength: newQuestions.length,
              addedQuestion: result.nextQuestion.questionId
            });
            return newQuestions;
          });
        } else {
          console.error('🔍 DEBUG: ❌ CRITICAL: result.nextQuestion is undefined/null!');
          setQuestionError('Failed to load next question. This may be the end of the quiz or a system error.');
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setQuestionError("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextQuestion = () => {
    if (activeGradingMode === 'complete') {
      // Complete-then-grade mode: navigate without feedback
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < totalQuestions) {
        // Record time spent on current question
        const currentTime = Date.now();
        const startTime = questionStartTimes[currentQuestionIndex];
        
        // Set start time for next question
        setQuestionStartTimes(prev => ({
          ...prev,
          [nextIndex]: currentTime
        }));
        
        setCurrentQuestionIndex(nextIndex);
        setCurrentAnswer(userAnswers[nextIndex] || null);
        
        // Ensure no feedback shows in complete mode
        setLastAnswerFeedback(null);
      }
    } else {
      // Immediate mode: clear feedback and move to next
      setLastAnswerFeedback(null);
      setCurrentAnswer(null);
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (activeGradingMode === 'complete' && currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentAnswer(userAnswers[prevIndex] || null);
      
      // Set start time for previous question if returning to it
      setQuestionStartTimes(prev => ({
        ...prev,
        [prevIndex]: Date.now()
      }));
      
      // Ensure no feedback shows in complete mode
      setLastAnswerFeedback(null);
    }
  };

  const submitFinalQuiz = async () => {
    console.log('🏁 Attempting final quiz submission:', {
      totalAnswers: Object.keys(userAnswers).length,
      totalQuestions,
      activeGradingMode,
      allAnswered: Object.keys(userAnswers).length === totalQuestions
    });
    
    if (Object.keys(userAnswers).length !== totalQuestions) {
      setQuestionError('Please answer all questions before submitting.');
      return;
    }
    
    setIsSubmittingFinal(true);
    setQuestionError(null);
    
    try {
      const currentTime = Date.now();
      
      // Format answers for submission
      const formattedAnswers = allQuestions.map((question, index) => {
        const startTime = questionStartTimes[index] || currentTime;
        const endTime = index === currentQuestionIndex ? currentTime : (questionStartTimes[index + 1] || currentTime);
        
        return {
          questionId: question.questionId,
          selectedAnswer: userAnswers[index],
          timeSpent: Math.max(1, Math.round((endTime - startTime) / 1000)),
          position: index + 1
        };
      });
      
      const results = await submitAllAnswers(currentQuizId, formattedAnswers);
      
      // Set results and show results page
      setResultData(results);
      setShowResults(true);
      
    } catch (error) {
      console.error('Error submitting final quiz:', error);
      setQuestionError('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setAllQuestions([]);
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
    setUserAnswers({});
    setQuestionStartTimes({});
    setIsSubmittingFinal(false);
    setActiveGradingMode('immediate'); // Reset to default
    console.log('🔄 Quiz reset, grading mode reset to immediate');
  };

  const handleQuestionCountChange = (value) => {
    const newQuestionCount = parseInt(value);
    setQuizConfig(prev => ({
      ...prev,
      questionCount: newQuestionCount
    }));
  };

  const handleCompetencyWeightChange = (competency, value) => {
    const newWeight = parseInt(value);
    setQuizConfig(prev => ({
      ...prev,
      competencyWeights: {
        ...prev.competencyWeights,
        [competency]: newWeight
      }
    }));
  };

  const handleGradingModeChange = (mode) => {
    setQuizConfig(prev => ({
      ...prev,
      gradingMode: mode
    }));
  };

  // Get current question based on mode
  const currentQuestion = activeGradingMode === 'complete' 
    ? allQuestions[currentQuestionIndex] 
    : questions[currentQuestionIndex];
    
  // Debug current question state
  if (!currentQuestion && quizStarted) {
    console.error('🔍 DEBUG: ❌ currentQuestion is undefined!', {
      activeGradingMode,
      currentQuestionIndex,
      totalQuestions,
      questionsLength: questions.length,
      allQuestionsLength: allQuestions.length,
      isComplete: activeGradingMode === 'complete'
    });
  }
    
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const answeredQuestionsCount = activeGradingMode === 'complete' 
    ? Object.keys(userAnswers).length 
    : currentQuestionIndex;

  if (!user) {
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

                                    {/* Instant Grading Toggle */}
                                    <div className="setting-group">
                                        <div className="instant-grading-setting">
                                            <div className="setting-info">
                                                <label htmlFor="instant-grading-quiz">🔄 Instant Grading</label>
                                                <p className="setting-description">
                                                    Get immediate feedback after each question
                                                </p>
                                            </div>
                                            <div className="setting-control">
                                                <label className="quiz-toggle-switch">
                                                    <input
                                                        id="instant-grading-quiz"
                                                        type="checkbox"
                                                        checked={quizConfig.instantGrading}
                                                        onChange={(e) => handleInstantGradingChange(e.target.checked)}
                                                    />
                                                    <span className="quiz-toggle-slider"></span>
                                                </label>
                                            </div>
                                        </div>
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
                                
                                {/* Instant Feedback Display */}
                                {instantGradingEnabled && instantFeedback[currentQuestionIndex] && selectedAnswers[currentQuestionIndex] && (
                                    <div className={`instant-feedback ${instantFeedback[currentQuestionIndex].isCorrect ? 'correct' : 'incorrect'}`}>
                                        <div className="feedback-header">
                                            <span className="feedback-icon">
                                                {instantFeedback[currentQuestionIndex].isCorrect ? '✅' : '❌'}
                                            </span>
                                            <span className="feedback-result">
                                                {instantFeedback[currentQuestionIndex].isCorrect ? 'Correct!' : 'Incorrect'}
                                            </span>
                                            {!instantFeedback[currentQuestionIndex].isCorrect && (
                                                <span className="correct-answer">
                                                    Correct answer: {instantFeedback[currentQuestionIndex].correctAnswer}
                                                </span>
                                            )}
                                        </div>
                                        {instantFeedback[currentQuestionIndex].explanation && (
                                            <div className="feedback-explanation">
                                                <strong>Explanation:</strong> {instantFeedback[currentQuestionIndex].explanation}
                                            </div>
                                        )}
                                        {instantFeedback[currentQuestionIndex].currentScore && (
                                            <div className="feedback-score">
                                                Current Score: {instantFeedback[currentQuestionIndex].currentScore.correct}/{instantFeedback[currentQuestionIndex].currentScore.total} ({instantFeedback[currentQuestionIndex].currentScore.percentage}%)
                                            </div>
                                        )}
                                    </div>
                                )}
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


                  <div className="setting-group">
                    <label>📚 Content Focus</label>
                    <div className="competency-sliders">
                      {Object.entries(quizConfig.competencyWeights).map(([competency, weight]) => (
                        <div key={competency} className="competency-slider">
                          <label>{competency}: <strong>{weight}%</strong></label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={weight}
                            onChange={(e) => handleCompetencyWeightChange(competency, e.target.value)}
                            className="slider competency-weight-slider"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="quiz-actions">
                <button
                  onClick={startQuiz}
                  disabled={isLoading}
                  className="start-quiz-btn"
                >
                  {isLoading ? 'Starting Quiz...' : 'Start Quiz'}
                </button>
                
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="config-btn"
                >
                  {showConfig ? '🔧 Hide Settings' : '🔧 Quiz Settings'}
                </button>
              </div>
            </div>
          </>
        ) : showHistory ? (
          <div>Quiz History Content Here</div>
        ) : showResults ? (
          <QuizResults 
            resultData={resultData}
            onRetakeQuiz={resetQuiz}
            onViewHistory={() => {
              setShowResults(false);
              setShowHistory(true);
            }}
          />
        ) : (
          <div className="quiz-active">
            <div className="quiz-header">
              <div className="quiz-progress">
                <span className="question-counter">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className={`quiz-mode-indicator ${activeGradingMode}`}>
                  {activeGradingMode === 'immediate' ? '📚 Study Mode' : '📝 Exam Mode'}
                </span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {questionError && <div className="error-container">{questionError}</div>}

            {currentQuestion ? (
              <div className="question-container">
                <h3 className="question-text">{currentQuestion.question}</h3>
                <div className="options-container">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <label
                      key={option}
                      className={`option-label 
                        ${currentAnswer === option ? 'selected' : ''}
                        ${activeGradingMode === 'immediate' && lastAnswerFeedback && option === lastAnswerFeedback.correctAnswer ? 'correct' : ''}
                        ${activeGradingMode === 'immediate' && lastAnswerFeedback && currentAnswer === option && !lastAnswerFeedback.isCorrect ? 'incorrect' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestionIndex}`}
                        value={option}
                        checked={currentAnswer === option}
                        onChange={() => handleAnswerSelect(option)}
                        disabled={isSubmitting || (activeGradingMode === 'immediate' && lastAnswerFeedback)}
                      />
                      <span className="option-letter">{option}</span>
                      <span className="option-text">{currentQuestion.options[option]}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="question-loading">
                <div className="loading-spinner"></div>
                <p>Loading question...</p>
              </div>
            )}

            {activeGradingMode === 'immediate' && lastAnswerFeedback && (
              <div className={`feedback-container ${lastAnswerFeedback.isCorrect ? 'correct' : 'incorrect'}`}>
                <h4>{lastAnswerFeedback.isCorrect ? 'Correct!' : 'Incorrect'}</h4>
                {!lastAnswerFeedback.isCorrect && <p><strong>Correct Answer: {lastAnswerFeedback.correctAnswer}</strong></p>}
                <p>{lastAnswerFeedback.explanation}</p>
              </div>
            )}

            {activeGradingMode === 'complete' && (
              <div className="quiz-progress-summary">
                <p>Progress: {answeredQuestionsCount} of {totalQuestions} questions answered</p>
                {answeredQuestionsCount === totalQuestions && (
                  <p className="ready-submit">✅ All questions answered! Ready to submit for grading.</p>
                )}
              </div>
            )}

            <div className="quiz-navigation">
              {activeGradingMode === 'immediate' ? (
                // Immediate mode navigation
                lastAnswerFeedback ? (
                  (isLastQuestion && lastAnswerFeedback) ? (
                    <button onClick={() => navigate(`/quiz/results/${currentQuizId}`)} className="submit-btn">View Results</button>
                  ) : (
                    <button onClick={goToNextQuestion} className="nav-btn next-btn">Next Question</button>
                  )
                ) : (
                  <button onClick={handleSubmitAnswer} disabled={isSubmitting || !currentAnswer} className="submit-btn">
                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                  </button>
                )
              ) : (
                // Complete-then-grade mode navigation
                <div className="complete-mode-navigation">
                  <div className="nav-buttons">
                    {currentQuestionIndex > 0 && (
                      <button onClick={goToPreviousQuestion} className="nav-btn prev-btn">
                        ← Previous
                      </button>
                    )}
                    
                    {!isLastQuestion ? (
                      <button 
                        onClick={goToNextQuestion} 
                        className="nav-btn next-btn"
                        disabled={!currentAnswer}
                      >
                        Next →
                      </button>
                    ) : (
                      <button 
                        onClick={submitFinalQuiz} 
                        disabled={isSubmittingFinal || answeredQuestionsCount !== totalQuestions}
                        className="submit-btn final-submit"
                      >
                        {isSubmittingFinal ? 'Submitting Quiz...' : 'Submit Quiz for Grading'}
                      </button>
                    )}
                  </div>
                  
                  <div className="question-indicator">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuizPage;