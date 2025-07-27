import React, { useState, useEffect } from 'react';
import progressService from '../api/progressService';
import CNA_SKILL_SCENARIOS from '../data/cnaSkillScenarios';
import '../styles/ProgressDashboard.css';

const ProgressDashboard = () => {
  const [progressSummary, setProgressSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchProgressSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await progressService.getProgressSummary();
      setProgressSummary(summary);
    } catch (err) {
      console.error('Error fetching progress summary:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressSummary();
  }, [refreshTrigger]);

  // Function to manually refresh data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Set up auto-refresh and handle visibility changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    }, 30000);

    // Refresh when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0 minutes';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  const getSkillTitle = (skillId) => {
    const scenario = CNA_SKILL_SCENARIOS[skillId];
    return scenario ? scenario.title : skillId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCompletionColor = (percentage) => {
    if (percentage === 0) return '#e0e0e0';
    if (percentage < 50) return '#ff9800';
    if (percentage < 100) return '#2196f3';
    return '#4caf50';
  };

  const getSkillCategoryIcon = (skillId) => {
    const categories = {
      'hand-hygiene': '🧼',
      'elastic-stocking': '🧦',
      'ambulate-transfer-belt': '🚶',
      'bedpan-use': '🚽',
      'radial-pulse': '💓',
      'respirations': '🫁',
      'ppe-gown-gloves': '🧤',
      'feeding-client': '🍽️',
      'modified-bed-bath': '🛁',
      'transfer-bed-wheelchair': '♿',
      'manual-blood-pressure': '🩺'
    };
    return categories[skillId] || '📚';
  };

  if (loading) {
    return (
      <div className="progress-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading your progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-dashboard error">
        <p>{error}</p>
      </div>
    );
  }

  if (!progressSummary) {
    return (
      <div className="progress-dashboard no-data">
        <p>No progress data available. Start a skill to track your progress!</p>
      </div>
    );
  }

  return (
    <div className="progress-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>📊 Your Learning Progress</h2>
          <p>Track your CNA skill development journey</p>
        </div>
        <button 
          onClick={refreshData} 
          className="refresh-button"
          disabled={loading}
          title="Refresh progress data"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>{progressSummary.completedSkills}</h3>
            <p>Skills Completed</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">📚</div>
          <div className="card-content">
            <h3>{progressSummary.inProgressSkills}</h3>
            <p>Skills In Progress</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <h3>{formatDuration(progressSummary.totalTimeSpent)}</h3>
            <p>Total Study Time</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>{progressSummary.averageCompletionPercentage}%</h3>
            <p>Average Progress</p>
          </div>
        </div>
      </div>

      <div className="skills-progress">
        <h3>Skills Progress Overview</h3>
        
        {progressSummary.skillsProgress && progressSummary.skillsProgress.length > 0 ? (
          <div className="skills-grid">
            {progressSummary.skillsProgress.map((skill) => (
              <div key={skill.skillId} className="skill-card">
                <div className="skill-header">
                  <span className="skill-icon">{getSkillCategoryIcon(skill.skillId)}</span>
                  <div className="skill-info">
                    <h4 className="skill-title">{getSkillTitle(skill.skillId)}</h4>
                    <p className="skill-meta">
                      Last updated: {new Date(skill.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="completion-badge">
                    {skill.isCompleted ? '✅' : `${skill.completionPercentage}%`}
                  </div>
                </div>

                <div className="skill-progress-bar">
                  <div 
                    className="skill-progress-fill"
                    style={{ 
                      width: `${skill.completionPercentage}%`,
                      backgroundColor: getCompletionColor(skill.completionPercentage)
                    }}
                  ></div>
                </div>

                <div className="skill-components">
                  <div className="component">
                    <span className="component-label">Patient Sim:</span>
                    <span className={`component-status ${skill.patientSimCompleted ? 'completed' : 'pending'}`}>
                      {skill.patientSimCompleted ? '✅' : '⏳'}
                    </span>
                  </div>
                  <div className="component">
                    <span className="component-label">Chat Sim:</span>
                    <span className={`component-status ${skill.chatSimCompleted ? 'completed' : 'pending'}`}>
                      {skill.chatSimCompleted ? '✅' : '⏳'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-skills">
            <p>🚀 Start your first skill to see progress here!</p>
          </div>
        )}
      </div>

      {progressSummary.completedSkills > 0 && (
        <div className="achievements">
          <h3>🏆 Achievements</h3>
          <div className="achievement-list">
            {progressSummary.completedSkills >= 1 && (
              <div className="achievement">
                <span className="achievement-icon">🎯</span>
                <span className="achievement-text">First Skill Completed</span>
              </div>
            )}
            {progressSummary.completedSkills >= 5 && (
              <div className="achievement">
                <span className="achievement-icon">🌟</span>
                <span className="achievement-text">5 Skills Mastered</span>
              </div>
            )}
            {progressSummary.completedSkills >= 10 && (
              <div className="achievement">
                <span className="achievement-icon">🏅</span>
                <span className="achievement-text">CNA Expert</span>
              </div>
            )}
            {progressSummary.totalTimeSpent >= 3600 && (
              <div className="achievement">
                <span className="achievement-icon">⏰</span>
                <span className="achievement-text">Dedicated Learner (1+ hour)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard;