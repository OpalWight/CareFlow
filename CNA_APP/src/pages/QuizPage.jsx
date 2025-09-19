import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import Layout from '../components/Layout';
import QuizResults from '../components/QuizResults';
import { generateQuizQuestions, submitAnswer, getQuizHistory, retakeQuiz, getQuestionByPosition, getQuizResults, getAllQuestions, submitAllAnswers } from '../api/quizApi';
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
    gradingMode: 'immediate',
    competencyWeights: {
      'Physical Care Skills': 63,
      'Psychosocial Care Skills': 10,
      'Role of the Nurse Aide': 27
    }
  });
  
  // Complete-then-grade mode state
  const [allQuestions, setAllQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [questionStartTimes, setQuestionStartTimes] = useState({});
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [activeGradingMode, setActiveGradingMode] = useState('immediate'); // Actual grading mode from server

  const startQuiz = async () => {
    setIsLoading(true);
    setQuestionError(null);
    
    try {
      const response = await generateQuizQuestions(quizConfig);
      console.log('🎯 Quiz generation response:', { 
        gradingMode: response.gradingMode, 
        configGradingMode: quizConfig.gradingMode 
      });
      
      if (response && response.sessionId) {
        setCurrentQuizId(response.sessionId);
        setTotalQuestions(response.totalQuestions || quizConfig.questionCount);
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
        setProgress({ correct: 0, incorrect: 0 });
        
        // Set the actual grading mode from server response
        const serverGradingMode = response.gradingMode || quizConfig.gradingMode;
        setActiveGradingMode(serverGradingMode);
        console.log('📋 Active grading mode set to:', serverGradingMode);
        
        if (serverGradingMode === 'complete') {
          // Complete-then-grade mode: load all questions at once
          console.log('🎯 Loading all questions for complete mode');
          const allQuestionsResponse = await getAllQuestions(response.sessionId);
          setAllQuestions(allQuestionsResponse.questions);
          setUserAnswers({});
          setQuestionStartTimes({});
          
          // Clear any previous grading feedback for complete mode
          setLastAnswerFeedback(null);
          console.log('🧹 Cleared lastAnswerFeedback for complete mode');
          
          // Set start time for first question
          setQuestionStartTimes(prev => ({
            ...prev,
            [0]: Date.now()
          }));
        } else {
          // Immediate mode: load first question only
          if (response.firstQuestion) {
            setQuestions([response.firstQuestion]);
          } else {
            throw new Error('Invalid quiz response format');
          }
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

  const handleAnswerSelect = (selectedOption) => {
    console.log('📝 Answer selected:', { 
      option: selectedOption, 
      activeGradingMode, 
      questionIndex: currentQuestionIndex,
      hasLastAnswerFeedback: !!lastAnswerFeedback,
      currentAnswer: currentAnswer
    });
    
    if (activeGradingMode === 'complete') {
      // Complete-then-grade mode: store answer locally
      setUserAnswers(prev => {
        const newAnswers = {
          ...prev,
          [currentQuestionIndex]: selectedOption
        };
        console.log('💾 Updated user answers:', { 
          questionIndex: currentQuestionIndex,
          selectedOption,
          totalAnswered: Object.keys(newAnswers).length 
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

    // Prevent immediate grading in complete mode - CRITICAL GUARD
    if (activeGradingMode === 'complete') {
      console.error('❌ CRITICAL ERROR: handleSubmitAnswer called in complete mode!', {
        activeGradingMode,
        currentQuestionIndex,
        quizConfigMode: quizConfig.gradingMode,
        currentAnswer
      });
      setQuestionError('SYSTEM ERROR: Immediate grading attempted in exam mode. This is a bug - please refresh and try again.');
      return;
    }

    console.log('📤 Submitting answer for immediate grading:', { 
      questionId: currentQuestion.questionId, 
      answer: currentAnswer,
      mode: activeGradingMode 
    });

    setIsSubmitting(true);
    setQuestionError(null);

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
                  <li>Receive immediate feedback after each question</li>
                  <li>Complete all questions to see your final results</li>
                </ul>
              </div>

              {showConfig && (
                <div className="quiz-configuration">
                  <h3>🎛️Quiz Settings</h3>
                  
                  <div className="setting-group">
                    <label>🎯 Quiz Mode</label>
                    <div className="grading-mode-selection">
                      <label className={`mode-option ${quizConfig.gradingMode === 'immediate' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="gradingMode"
                          value="immediate"
                          checked={quizConfig.gradingMode === 'immediate'}
                          onChange={(e) => handleGradingModeChange(e.target.value)}
                        />
                        <span className="mode-title">Study Mode</span>
                        <span className="mode-description">Get feedback after each question</span>
                      </label>
                      <label className={`mode-option ${quizConfig.gradingMode === 'complete' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="gradingMode"
                          value="complete"
                          checked={quizConfig.gradingMode === 'complete'}
                          onChange={(e) => handleGradingModeChange(e.target.value)}
                        />
                        <span className="mode-title">Exam Mode</span>
                        <span className="mode-description">Complete quiz then see results</span>
                      </label>
                    </div>
                  </div>

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