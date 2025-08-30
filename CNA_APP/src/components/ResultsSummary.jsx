import React from 'react';

const ResultsSummary = ({ summary, competencyPerformance, userStats, filters }) => {
    if (!summary) {
        return <div className="results-summary error">Summary data not available</div>;
    }

    const getPerformanceLevel = (percentage) => {
        if (percentage >= 90) return { level: 'excellent', color: '#4CAF50', label: 'Excellent' };
        if (percentage >= 80) return { level: 'good', color: '#8BC34A', label: 'Good' };
        if (percentage >= 70) return { level: 'satisfactory', color: '#FFC107', label: 'Satisfactory' };
        if (percentage >= 60) return { level: 'needs-improvement', color: '#FF9800', label: 'Needs Improvement' };
        return { level: 'poor', color: '#F44336', label: 'Needs Significant Improvement' };
    };

    const performance = getPerformanceLevel(summary.percentage);

    const formatDuration = (minutes) => {
        if (minutes < 60) {
            return `${minutes} minutes`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="results-summary">
            {/* Main Score Display */}
            <div className="score-display">
                <div className="score-circle" style={{ borderColor: performance.color }}>
                    <div className="score-percentage" style={{ color: performance.color }}>
                        {summary.percentage}%
                    </div>
                    <div className="score-fraction">
                        {summary.score} / {summary.totalQuestions}
                    </div>
                </div>
                <div className="performance-info">
                    <div className="performance-level" style={{ color: performance.color }}>
                        {performance.label}
                    </div>
                    <div className="completion-date">
                        Completed: {formatDate(summary.completedAt)}
                    </div>
                    <div className="duration">
                        Duration: {formatDuration(summary.durationMinutes)}
                    </div>
                    {summary.isRetake && (
                        <div className="retake-indicator">
                            🔄 This was a retake
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
                <div className="stat-item correct">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <div className="stat-value">{filters.correctAnswers}</div>
                        <div className="stat-label">Correct</div>
                    </div>
                </div>
                <div className="stat-item incorrect">
                    <div className="stat-icon">❌</div>
                    <div className="stat-info">
                        <div className="stat-value">{filters.incorrectAnswers}</div>
                        <div className="stat-label">Incorrect</div>
                    </div>
                </div>
                <div className="stat-item total">
                    <div className="stat-icon">📝</div>
                    <div className="stat-info">
                        <div className="stat-value">{filters.totalQuestions}</div>
                        <div className="stat-label">Total</div>
                    </div>
                </div>
            </div>

            {/* Competency Performance */}
            {competencyPerformance && Object.keys(competencyPerformance).length > 0 && (
                <div className="competency-performance">
                    <h3>Performance by Competency Area</h3>
                    <div className="competency-grid">
                        {Object.entries(competencyPerformance).map(([area, performance]) => {
                            const areaPerformance = getPerformanceLevel(performance.percentage);
                            return (
                                <div key={area} className="competency-card">
                                    <div className="competency-header">
                                        <h4>{area}</h4>
                                        <div 
                                            className="competency-percentage"
                                            style={{ color: areaPerformance.color }}
                                        >
                                            {performance.percentage}%
                                        </div>
                                    </div>
                                    <div className="competency-details">
                                        <div className="competency-score">
                                            {performance.correct} / {performance.total} correct
                                        </div>
                                        <div className="competency-bar">
                                            <div 
                                                className="competency-fill"
                                                style={{ 
                                                    width: `${performance.percentage}%`,
                                                    backgroundColor: areaPerformance.color
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* User Statistics */}
            {userStats && (
                <div className="user-statistics">
                    <h3>Your Progress</h3>
                    <div className="stats-grid">
                        <div className="stat-box">
                            <div className="stat-number">{userStats.totalAttempts}</div>
                            <div className="stat-description">Total Attempts</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-number">{userStats.averageScore}%</div>
                            <div className="stat-description">Average Score</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-number">{userStats.bestScore}%</div>
                            <div className="stat-description">Best Score</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-trend">
                                {userStats.improvementTrend === 'improving' && '📈'}
                                {userStats.improvementTrend === 'stable' && '➡️'}
                                {userStats.improvementTrend === 'declining' && '📉'}
                                {userStats.improvementTrend === 'No data' && '📊'}
                            </div>
                            <div className="stat-description">Trend</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Tips */}
            <div className="performance-tips">
                {summary.percentage >= 90 && (
                    <div className="tip excellent">
                        🌟 Outstanding performance! You've mastered this material. Consider helping others or exploring advanced topics.
                    </div>
                )}
                {summary.percentage >= 80 && summary.percentage < 90 && (
                    <div className="tip good">
                        👍 Great job! Review the questions you missed to achieve excellence.
                    </div>
                )}
                {summary.percentage >= 70 && summary.percentage < 80 && (
                    <div className="tip satisfactory">
                        📚 Good progress! Focus on the competency areas where you scored lower.
                    </div>
                )}
                {summary.percentage < 70 && (
                    <div className="tip needs-improvement">
                        📖 Keep studying! Review all incorrect answers and consider additional practice in weak areas.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultsSummary;