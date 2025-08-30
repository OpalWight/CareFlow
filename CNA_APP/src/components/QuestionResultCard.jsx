import React, { useState } from 'react';

const QuestionResultCard = ({ question, showExplanation = true }) => {
    const [explanationExpanded, setExplanationExpanded] = useState(false);

    if (!question) {
        return <div className="question-result-card error">Question data not available</div>;
    }

    const getOptionClassName = (optionKey) => {
        let className = 'option';
        
        // Highlight correct answer
        if (optionKey === question.correctAnswer) {
            className += ' correct-answer';
        }
        
        // Highlight user's selection
        if (optionKey === question.userAnswer) {
            if (question.isCorrect) {
                className += ' user-correct';
            } else {
                className += ' user-incorrect';
            }
        }
        
        return className;
    };

    const getResultIcon = () => {
        return question.isCorrect ? '✅' : '❌';
    };

    const getResultStatus = () => {
        if (question.userAnswer === null || question.userAnswer === undefined) {
            return 'No answer selected';
        }
        return question.isCorrect ? 'Correct' : 'Incorrect';
    };

    return (
        <div className={`question-result-card ${question.isCorrect ? 'correct' : 'incorrect'}`}>
            {/* Question Header */}
            <div className="question-header">
                <div className="question-number">
                    Question {question.questionNumber}
                </div>
                <div className="result-status">
                    <span className="result-icon">{getResultIcon()}</span>
                    <span className="result-text">{getResultStatus()}</span>
                </div>
                <div className="competency-area">
                    <span className="competency-label">Area:</span>
                    <span className="competency-value">{question.competencyArea}</span>
                </div>
            </div>

            {/* Question Text */}
            <div className="question-text">
                <h3>{question.question}</h3>
            </div>

            {/* Answer Options */}
            <div className="answer-options">
                {['A', 'B', 'C', 'D'].map(optionKey => (
                    <div 
                        key={optionKey} 
                        className={getOptionClassName(optionKey)}
                    >
                        <div className="option-header">
                            <span className="option-letter">{optionKey}</span>
                            <div className="option-indicators">
                                {optionKey === question.correctAnswer && (
                                    <span className="correct-indicator" title="Correct Answer">✓</span>
                                )}
                                {optionKey === question.userAnswer && (
                                    <span className="user-indicator" title="Your Answer">👤</span>
                                )}
                            </div>
                        </div>
                        <div className="option-text">
                            {question.options[optionKey]}
                        </div>
                    </div>
                ))}
            </div>

            {/* Answer Summary */}
            <div className="answer-summary">
                <div className="summary-row">
                    <span className="summary-label">Your Answer:</span>
                    <span className={`summary-value ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                        {question.userAnswer ? `${question.userAnswer} - ${question.options[question.userAnswer]}` : 'No answer selected'}
                    </span>
                </div>
                <div className="summary-row">
                    <span className="summary-label">Correct Answer:</span>
                    <span className="summary-value correct">
                        {question.correctAnswer} - {question.options[question.correctAnswer]}
                    </span>
                </div>
            </div>

            {/* Explanation Section */}
            {showExplanation && question.explanation && (
                <div className="explanation-section">
                    <button 
                        className="explanation-toggle"
                        onClick={() => setExplanationExpanded(!explanationExpanded)}
                    >
                        <span className="explanation-icon">💡</span>
                        <span className="explanation-label">Explanation</span>
                        <span className={`explanation-arrow ${explanationExpanded ? 'expanded' : ''}`}>
                            ▼
                        </span>
                    </button>
                    
                    {explanationExpanded && (
                        <div className="explanation-content">
                            <p>{question.explanation}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuestionResultCard;