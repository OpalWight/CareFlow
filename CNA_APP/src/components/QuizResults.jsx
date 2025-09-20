import React from 'react';
import '../styles/QuizResults.css';

const QuizResults = ({ resultData, onRetakeQuiz, onViewHistory }) => {
  if (!resultData) {
    return (
      <div className="quiz-results-container">
        <div className="loading-spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  const { finalScore, results = [], sessionId, gradedAt } = resultData;
  const percentage = finalScore?.percentage || 0;
  const correct = finalScore?.correct || 0;
  const total = finalScore?.total || 0;

  // Calculate performance by competency area
  const competencyPerformance = {};
  results.forEach(result => {
    const area = result.competencyArea;
    if (!competencyPerformance[area]) {
      competencyPerformance[area] = { correct: 0, total: 0 };
    }
    competencyPerformance[area].total++;
    if (result.isCorrect) {
      competencyPerformance[area].correct++;
    }
  });

  // Calculate competency percentages
  Object.keys(competencyPerformance).forEach(area => {
    const perf = competencyPerformance[area];
    perf.percentage = Math.round((perf.correct / perf.total) * 100);
  });

  const getPerformanceClass = (percentage) => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 60) return 'fair';
    return 'needs-improvement';
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 80) return 'Excellent work! You have a strong understanding of this material.';
    if (percentage >= 70) return 'Good job! You have a solid grasp of the concepts.';
    if (percentage >= 60) return 'Fair performance. Review the areas you missed and try again.';
    return 'Needs improvement. Consider reviewing the study materials before retaking.';
  };

  return (
    <div className="quiz-results-container">
      <div className="results-header">
        <h1>Quiz Results</h1>
        <div className={`overall-score ${getPerformanceClass(percentage)}`}>
          <div className="score-circle">
            <span className="score-number">{percentage}%</span>
            <span className="score-fraction">{correct}/{total}</span>
          </div>
          <p className="score-message">{getPerformanceMessage(percentage)}</p>
        </div>
      </div>

      <div className="results-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Correct Answers</span>
            <span className="stat-value correct">{correct}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Incorrect Answers</span>
            <span className="stat-value incorrect">{total - correct}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Questions</span>
            <span className="stat-value total">{total}</span>
          </div>
        </div>

        {Object.keys(competencyPerformance).length > 0 && (
          <div className="competency-breakdown">
            <h3>Performance by Competency Area</h3>
            <div className="competency-grid">
              {Object.entries(competencyPerformance).map(([area, perf]) => (
                <div key={area} className={`competency-item ${getPerformanceClass(perf.percentage)}`}>
                  <h4 className="competency-title">{area}</h4>
                  <div className="competency-score">
                    <span className="competency-percentage">{perf.percentage}%</span>
                    <span className="competency-fraction">({perf.correct}/{perf.total})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="detailed-results">
        <h3>Question-by-Question Review</h3>
        <div className="questions-review">
          {results.map((result, index) => (
            <div key={result.questionId || index} className={`question-review-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="question-header">
                <span className="question-number">Question {index + 1}</span>
                <span className={`question-status ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                  {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>
              
              <div className="question-content">
                <p className="question-text">{result.question}</p>
                
                <div className="answer-options">
                  {Object.entries(result.options || {}).map(([letter, text]) => (
                    <div 
                      key={letter} 
                      className={`answer-option 
                        ${letter === result.selectedAnswer ? 'selected' : ''} 
                        ${letter === result.correctAnswer ? 'correct-answer' : ''}
                        ${letter === result.selectedAnswer && !result.isCorrect ? 'incorrect-selection' : ''}
                      `}
                    >
                      <span className="option-letter">{letter}</span>
                      <span className="option-text">{text}</span>
                      {letter === result.correctAnswer && (
                        <span className="correct-indicator">✓ Correct Answer</span>
                      )}
                      {letter === result.selectedAnswer && letter !== result.correctAnswer && (
                        <span className="incorrect-indicator">✗ Your Answer</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {result.explanation && (
                  <div className="explanation">
                    <h5>Explanation:</h5>
                    <p>{result.explanation}</p>
                  </div>
                )}
                
                <div className="question-metadata">
                  <span className="competency-tag">{result.competencyArea}</span>
                  {result.skillCategory && (
                    <span className="skill-tag">{result.skillCategory}</span>
                  )}
                  {result.timeSpent && (
                    <span className="time-tag">Time: {result.timeSpent}s</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="results-actions">
        <button onClick={onRetakeQuiz} className="action-btn retake-btn">
          🔄 Retake Quiz
        </button>
        <button onClick={onViewHistory} className="action-btn history-btn">
          📊 View Quiz History
        </button>
      </div>

      {gradedAt && (
        <div className="results-footer">
          <p className="completion-time">
            Completed on {new Date(gradedAt).toLocaleString()}
          </p>
          <p className="session-id">Session ID: {sessionId}</p>
        </div>
      )}
    </div>
  );
};

export default QuizResults;