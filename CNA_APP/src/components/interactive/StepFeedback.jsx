// Step Feedback Component for RAG Verification Results
// Displays intelligent feedback from the RAG verification system

import React, { useState, useEffect } from 'react';
import '../../styles/interactive/StepFeedback.css';

const StepFeedback = ({ feedback, stepName, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (feedback) {
      setIsVisible(true);
      // Auto-expand if there are critical errors
      if (feedback.criticalErrors && feedback.criticalErrors.length > 0) {
        setIsExpanded(true);
      }
    }
  }, [feedback]);

  if (!feedback || !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const getScoreIcon = (score) => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '✅';
    if (score >= 70) return '✓';
    if (score >= 60) return '⚠️';
    return '❌';
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Good';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`step-feedback-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`step-feedback-container ${feedback.performanceCategory?.level || 'satisfactory'}`}>
        {/* Header */}
        <div className="feedback-header">
          <div className="step-info">
            <h3>{stepName}</h3>
            <div className="score-display">
              <span className="score-icon">{getScoreIcon(feedback.score)}</span>
              <span className="score-text">{feedback.score}%</span>
            </div>
          </div>
          <button className="feedback-close" onClick={handleClose}>×</button>
        </div>

        {/* Performance Category */}
        <div className="performance-badge" style={{ backgroundColor: feedback.performanceCategory?.color }}>
          {feedback.performanceCategory?.message}
        </div>

        {/* Main Feedback */}
        <div className="feedback-content">
          <p className="feedback-text">{feedback.feedback}</p>

          {/* Critical Errors */}
          {feedback.criticalErrors && feedback.criticalErrors.length > 0 && (
            <div className="feedback-section critical-errors">
              <h4>🚨 Critical Issues</h4>
              <ul>
                {feedback.criticalErrors.map((error, index) => (
                  <li key={index} className="error-item">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Minor Issues */}
          {feedback.minorIssues && feedback.minorIssues.length > 0 && (
            <div className="feedback-section minor-issues">
              <h4>⚠️ Areas for Improvement</h4>
              <ul>
                {feedback.minorIssues.map((issue, index) => (
                  <li key={index} className="issue-item">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div className="feedback-section suggestions">
              <h4>💡 Suggestions</h4>
              <ul>
                {feedback.suggestions.map((suggestion, index) => (
                  <li key={index} className="suggestion-item">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Expandable Details */}
          <button 
            className="expand-details-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
          </button>

          {isExpanded && (
            <div className="feedback-details">
              {/* Assessment Breakdown */}
              {feedback.assessmentDetails && (
                <div className="assessment-breakdown">
                  <h4>📊 Detailed Assessment</h4>
                  <div className="assessment-grid">
                    <div className="assessment-item">
                      <span>Safety Compliance:</span>
                      <div className="score-bar">
                        <div 
                          className="score-fill" 
                          style={{ width: `${feedback.assessmentDetails.safetyCompliance}%` }}
                        ></div>
                        <span>{feedback.assessmentDetails.safetyCompliance}%</span>
                      </div>
                    </div>
                    <div className="assessment-item">
                      <span>Technical Accuracy:</span>
                      <div className="score-bar">
                        <div 
                          className="score-fill" 
                          style={{ width: `${feedback.assessmentDetails.technicalAccuracy}%` }}
                        ></div>
                        <span>{feedback.assessmentDetails.technicalAccuracy}%</span>
                      </div>
                    </div>
                    <div className="assessment-item">
                      <span>Supply Usage:</span>
                      <div className="score-bar">
                        <div 
                          className="score-fill" 
                          style={{ width: `${feedback.assessmentDetails.supplyUsage}%` }}
                        ></div>
                        <span>{feedback.assessmentDetails.supplyUsage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timing Analysis */}
              {feedback.timingAnalysis && (
                <div className="timing-analysis">
                  <h4>⏱️ Timing Analysis</h4>
                  <p className="timing-message">{feedback.timingAnalysis.message}</p>
                  <div className="timing-details">
                    <span>Time taken: {feedback.timingAnalysis.actualTime}s</span>
                    {feedback.timingAnalysis.efficiency && (
                      <span>Efficiency: {Math.round(feedback.timingAnalysis.efficiency)}%</span>
                    )}
                  </div>
                </div>
              )}

              {/* Learning Objectives */}
              {feedback.learningObjectives && feedback.learningObjectives.length > 0 && (
                <div className="learning-objectives">
                  <h4>🎯 Learning Objectives</h4>
                  {feedback.learningObjectives.map((objective, index) => (
                    <div key={index} className={`objective-item ${objective.priority}`}>
                      <h5>{objective.title}</h5>
                      <p>{objective.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* System Info */}
              <div className="system-info">
                <div className="info-row">
                  <span>AI Confidence:</span>
                  <span className={`confidence-level ${feedback.confidence >= 0.8 ? 'high' : feedback.confidence >= 0.6 ? 'medium' : 'low'}`}>
                    {getConfidenceLevel(feedback.confidence)} ({Math.round(feedback.confidence * 100)}%)
                  </span>
                </div>
                <div className="info-row">
                  <span>Knowledge Used:</span>
                  <span className={feedback.knowledgeUsed ? 'positive' : 'neutral'}>
                    {feedback.knowledgeUsed ? 'Yes' : 'Fallback'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="feedback-actions">
          <button className="action-btn primary" onClick={handleClose}>
            Continue
          </button>
          {feedback.score < 70 && (
            <button className="action-btn secondary" onClick={() => {
              // You could implement a "retry step" functionality here
              console.log('Retry step requested');
            }}>
              Retry Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepFeedback;