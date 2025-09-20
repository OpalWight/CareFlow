import React, { useState, useEffect } from 'react';
import { useAuth } from '../api/AuthContext';
import Layout from '../components/Layout';
import '../styles/Settings.css';

function Settings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Load user preferences on component mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/quiz/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      } else {
        console.error('Failed to load preferences');
        setMessage({ type: 'error', text: 'Failed to load preferences' });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Error loading preferences' });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (path, value) => {
    setSaving(true);
    setMessage(null);

    try {
      const updates = {};
      const pathParts = path.split('.');
      
      // Build nested update object
      let current = updates;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current[pathParts[i]] = current[pathParts[i]] || {};
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;

      const response = await fetch('/api/quiz/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChange = (path, checked) => {
    updatePreference(path, checked);
  };

  const handleSelectChange = (path, value) => {
    updatePreference(path, value);
  };

  const handleNumberChange = (path, value) => {
    updatePreference(path, parseInt(value, 10));
  };

  if (loading) {
    return (
      <Layout>
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </Layout>
    );
  }

  if (!preferences) {
    return (
      <Layout>
        <div className="settings-error">
          <p>Failed to load settings. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="settings-container">
        <h1>Quiz Settings</h1>
        
        {message && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-sections">
          
          {/* Quiz Experience Settings */}
          <div className="settings-section">
            <h2>Quiz Experience</h2>
            

            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="show-progress">Show Progress</label>
                <p className="setting-description">
                  Display progress indicators during the quiz.
                </p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    id="show-progress"
                    type="checkbox"
                    checked={preferences.uiPreferences?.showProgress !== false}
                    onChange={(e) => handleToggleChange('uiPreferences.showProgress', e.target.checked)}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="show-timer">Show Timer</label>
                <p className="setting-description">
                  Display a timer during the quiz.
                </p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    id="show-timer"
                    type="checkbox"
                    checked={preferences.uiPreferences?.showTimer || false}
                    onChange={(e) => handleToggleChange('uiPreferences.showTimer', e.target.checked)}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="confirm-submission">Confirm Submission</label>
                <p className="setting-description">
                  Ask for confirmation before submitting the quiz.
                </p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    id="confirm-submission"
                    type="checkbox"
                    checked={preferences.uiPreferences?.confirmSubmission !== false}
                    onChange={(e) => handleToggleChange('uiPreferences.confirmSubmission', e.target.checked)}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Quiz Defaults */}
          <div className="settings-section">
            <h2>Quiz Defaults</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="question-count">Default Question Count</label>
                <p className="setting-description">
                  Number of questions in new quizzes.
                </p>
              </div>
              <div className="setting-control">
                <select
                  id="question-count"
                  value={preferences.quizComposition?.questionCount || 30}
                  onChange={(e) => handleNumberChange('quizComposition.questionCount', e.target.value)}
                  disabled={saving}
                >
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                  <option value={30}>30 questions</option>
                  <option value={40}>40 questions</option>
                  <option value={50}>50 questions</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="difficulty">Default Difficulty</label>
                <p className="setting-description">
                  Starting difficulty level for new quizzes.
                </p>
              </div>
              <div className="setting-control">
                <select
                  id="difficulty"
                  value={preferences.difficultySettings?.preferredDifficulty || 'adaptive'}
                  onChange={(e) => handleSelectChange('difficultySettings.preferredDifficulty', e.target.value)}
                  disabled={saving}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="adaptive">Adaptive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Learning Preferences */}
          <div className="settings-section">
            <h2>Learning Preferences</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="focus-weak-areas">Focus on Weak Areas</label>
                <p className="setting-description">
                  Emphasize topics where you need more practice.
                </p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    id="focus-weak-areas"
                    type="checkbox"
                    checked={preferences.learningPreferences?.focusOnWeakAreas !== false}
                    onChange={(e) => handleToggleChange('learningPreferences.focusOnWeakAreas', e.target.checked)}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="include-review">Include Review Questions</label>
                <p className="setting-description">
                  Mix in questions you've answered before for review.
                </p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    id="include-review"
                    type="checkbox"
                    checked={preferences.learningPreferences?.includeReviewQuestions !== false}
                    onChange={(e) => handleToggleChange('learningPreferences.includeReviewQuestions', e.target.checked)}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

        </div>

        {saving && (
          <div className="settings-saving">
            <div className="loading-spinner small"></div>
            <span>Saving...</span>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Settings;