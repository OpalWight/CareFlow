import React, { useState, useEffect } from 'react';
import progressService from '../api/progressService';
import '../styles/ProgressTracker.css';

const ProgressTracker = ({ skillId, showDetailedView = true, onProgressUpdate = null }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const progressData = await progressService.getSkillProgress(skillId);
        setProgress(progressData);
        
        if (onProgressUpdate) {
          onProgressUpdate(progressData);
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
        setError('Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };

    if (skillId) {
      fetchProgress();
    }
  }, [skillId, onProgressUpdate]);

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const getCompletionColor = (percentage) => {
    if (percentage === 0) return '#e0e0e0';
    if (percentage < 50) return '#ff9800';
    if (percentage < 100) return '#2196f3';
    return '#4caf50';
  };

  if (loading) {
    return (
      <div className="progress-tracker loading">
        <div className="loading-spinner"></div>
        <p>Loading progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-tracker error">
        <p>{error}</p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="progress-tracker no-data">
        <p>No progress data available</p>
      </div>
    );
  }

  const completionPercentage = progress.overallProgress?.completionPercentage || 0;
  const isCompleted = progress.overallProgress?.isCompleted || false;

  return (
    <div className={`progress-tracker ${showDetailedView ? 'detailed' : 'compact'}`}>
      <div className="progress-header">
        <h3 className="progress-title">
          {isCompleted ? '✅' : '📚'} Progress Overview
        </h3>
        <div className="overall-percentage">
          <span className="percentage-text" style={{ color: getCompletionColor(completionPercentage) }}>
            {completionPercentage}%
          </span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${completionPercentage}%`,
              backgroundColor: getCompletionColor(completionPercentage)
            }}
          ></div>
        </div>
      </div>

      {showDetailedView && (
        <div className="progress-details">
          <div className="progress-section">
            <h4>🎯 Patient Simulation</h4>
            <div className="section-stats">
              <div className="stat-item">
                <span className="stat-label">Status:</span>
                <span className={`stat-value ${progress.patientSimProgress?.isCompleted ? 'completed' : 'in-progress'}`}>
                  {progress.patientSimProgress?.isCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Steps:</span>
                <span className="stat-value">
                  {progress.patientSimProgress?.completedSteps?.length || 0}/
                  {progress.patientSimProgress?.totalSteps || 0}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Best Score:</span>
                <span className="stat-value">{progress.patientSimProgress?.bestScore || 0}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Attempts:</span>
                <span className="stat-value">{progress.patientSimProgress?.attempts || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time Spent:</span>
                <span className="stat-value">{formatDuration(progress.patientSimProgress?.timeSpent || 0)}</span>
              </div>
            </div>
          </div>

          <div className="progress-section">
            <h4>💬 Chat Simulation</h4>
            <div className="section-stats">
              <div className="stat-item">
                <span className="stat-label">Status:</span>
                <span className={`stat-value ${progress.chatSimProgress?.isCompleted ? 'completed' : 'in-progress'}`}>
                  {progress.chatSimProgress?.isCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sessions:</span>
                <span className="stat-value">
                  {progress.chatSimProgress?.sessionsCompleted || 0}/
                  {progress.chatSimProgress?.totalSessions || 1}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Rating:</span>
                <span className="stat-value">
                  {progress.chatSimProgress?.averageRating ? 
                    `⭐ ${progress.chatSimProgress.averageRating.toFixed(1)}` : 'Not rated'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time Spent:</span>
                <span className="stat-value">{formatDuration(progress.chatSimProgress?.timeSpent || 0)}</span>
              </div>
            </div>
          </div>

          <div className="progress-summary">
            <div className="summary-stat">
              <span className="summary-label">Total Time:</span>
              <span className="summary-value">{formatDuration(progress.overallProgress?.totalTimeSpent || 0)}</span>
            </div>
            {progress.overallProgress?.lastUpdatedAt && (
              <div className="summary-stat">
                <span className="summary-label">Last Updated:</span>
                <span className="summary-value">
                  {new Date(progress.overallProgress.lastUpdatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {isCompleted && (
            <div className="completion-badge">
              <span className="badge-icon">🏆</span>
              <span className="badge-text">Skill Completed!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;