import React from 'react';
import { useAuth } from '../api/AuthContext';
import Layout from '../components/Layout';
import '../styles/LearnerHome.css';

function LearnerHome() {
    const { user, isAuthenticated } = useAuth();

    const handleSkillsHub = () => {
        window.location.href = '/skills-hub';
    };

    const handleFlashcards = () => {
        window.location.href = '/flashcards';
    };

    const handleResources = () => {
        window.location.href = '/resources';
    };

    const handleSettings = () => {
        window.location.href = '/settings';
    };

    const handleHelp = () => {
        window.location.href = '/help';
    };

    const handleDashboard = () => {
        window.location.href = '/dashboard';
    };

    return (
        <Layout>
            <div className="learner-home-container">
                {isAuthenticated && user && (
                    <div className="learner-home-welcome">
                        <h1 className="learner-home-welcome-title">
                            Welcome back, {user.name}! 👋
                        </h1>
                        <p className="learner-home-welcome-message">
                            Ready to continue your CNA learning journey?
                        </p>
                    </div>
                )}

                <div className="learner-home-header">
                    <h1 className="learner-home-title">Learner Home</h1>
                    <p className="learner-home-subtitle">
                        Your central hub for CNA certification preparation and learning resources
                    </p>
                </div>

                <div className="learner-home-quick-actions">
                    <h2 className="learner-home-quick-actions-title">Quick Actions</h2>
                    <div className="learner-home-quick-actions-grid">
                        <div className="learner-home-quick-action" onClick={handleDashboard}>
                            <span className="learner-home-quick-action-icon">📊</span>
                            <span className="learner-home-quick-action-text">Dashboard</span>
                        </div>
                        <div className="learner-home-quick-action" onClick={handleSettings}>
                            <span className="learner-home-quick-action-icon">⚙️</span>
                            <span className="learner-home-quick-action-text">Settings</span>
                        </div>
                        <div className="learner-home-quick-action" onClick={handleHelp}>
                            <span className="learner-home-quick-action-icon">❓</span>
                            <span className="learner-home-quick-action-text">Help</span>
                        </div>
                        <div className="learner-home-quick-action" onClick={handleResources}>
                            <span className="learner-home-quick-action-icon">📚</span>
                            <span className="learner-home-quick-action-text">Resources</span>
                        </div>
                    </div>
                </div>

                <div className="learner-home-grid">
                    <div className="learner-home-card">
                        <span className="learner-home-card-icon">💬</span>
                        <h3 className="learner-home-card-title">Skills Practice Hub</h3>
                        <p className="learner-home-card-description">
                            Access organized CNA skills training modules including infection control, 
                            ADLs, mobility, and more. Practice with interactive AI guidance.
                        </p>
                        <button 
                            className="learner-home-card-button"
                            onClick={handleSkillsHub}
                        >
                            Enter Skills Hub
                        </button>
                    </div>

                    <div className="learner-home-card">
                        <span className="learner-home-card-icon">🎯</span>
                        <h3 className="learner-home-card-title">Flashcards</h3>
                        <p className="learner-home-card-description">
                            Review important CNA concepts, medical terminology, and procedures 
                            with our comprehensive flashcard system.
                        </p>
                        <button 
                            className="learner-home-card-button"
                            onClick={handleFlashcards}
                        >
                            Study Flashcards
                        </button>
                    </div>

                    <div className="learner-home-card">
                        <span className="learner-home-card-icon">📖</span>
                        <h3 className="learner-home-card-title">Learning Resources</h3>
                        <p className="learner-home-card-description">
                            Access curated learning materials, study guides, and reference 
                            documents to support your CNA certification journey.
                        </p>
                        <button 
                            className="learner-home-card-button"
                            onClick={handleResources}
                        >
                            Browse Resources
                        </button>
                    </div>

                    <div className="learner-home-card">
                        <span className="learner-home-card-icon">📊</span>
                        <h3 className="learner-home-card-title">Progress Tracking</h3>
                        <p className="learner-home-card-description">
                            Monitor your learning progress, view performance analytics, 
                            and track your certification preparation milestones.
                        </p>
                        <button 
                            className="learner-home-card-button"
                            onClick={handleDashboard}
                        >
                            View Progress
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default LearnerHome;