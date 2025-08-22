import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../api/AuthContext'; // Import the useAuth hook
import { startChatSession, sendChatMessage } from '../api/chatApi';
import progressService from '../api/progressService';
import '../styles/ChatPage.css';
import Layout from '../components/Layout';

const ChatPage = () => {
    const { user } = useAuth(); // Get the authenticated user
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [scenarioInfo, setScenarioInfo] = useState(null);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [sessionRating, setSessionRating] = useState(0);
    const [isSessionComplete, setIsSessionComplete] = useState(false);
    const [completedObjectives, setCompletedObjectives] = useState([]);
    const [allObjectivesComplete, setAllObjectivesComplete] = useState(false);
    const [lastRelevanceCheck, setLastRelevanceCheck] = useState(null);
    const [showSpecificObjectives, setShowSpecificObjectives] = useState(false);
    const [showModeSelection, setShowModeSelection] = useState(true);
    const [selectedEvaluationMode, setSelectedEvaluationMode] = useState(null);
    const chatContainerRef = useRef(null);

    // Get skillId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const skillId = urlParams.get('skillId');

    useEffect(() => {
        const startSession = async () => {
            if (!user || !selectedEvaluationMode || !skillId) return; // Don't start if there is no user, mode not selected, or no skillId

            setIsLoading(true);
            try {
                const { sessionId, patientInitialResponse, scenario, evaluationMode } = await startChatSession(user._id, skillId, selectedEvaluationMode);
                setSessionId(sessionId);
                setScenarioInfo({...scenario, evaluationMode});
                setSessionStartTime(Date.now());
                
                // Set objectives view based on evaluation mode
                setShowSpecificObjectives(evaluationMode === 'specific');
                
                // If there's no initial response, show instruction message
                if (patientInitialResponse) {
                    setMessages([{ role: 'model', content: patientInitialResponse }]);
                } else {
                    let modeText = '';
                    if (evaluationMode === 'specific') {
                        modeText = ' (Hard Mode: Steps must be completed in order)';
                    } else if (evaluationMode === 'extraHard') {
                        modeText = ' (Extra Hard Mode: Steps must be completed in order, no checklist shown)';
                    } else {
                        modeText = ' (Easy Mode: Practice naturally without following a checklist)';
                    }
                    setMessages([{ 
                        role: 'system', 
                        content: `💬 Introduce yourself and state your purpose to start the scenario${modeText}` 
                    }]);
                }
            } catch (error) {
                console.error("Failed to start chat session:", error);
                let errorMessage = "Error: Could not start the chat session.";
                
                // Provide more specific error messages
                if (error.response?.status === 404) {
                    errorMessage = `Error: Skill "${skillId}" not found. Please select a valid skill.`;
                } else if (error.response?.status === 400) {
                    errorMessage = error.response?.data?.message || "Error: Invalid request parameters.";
                } else if (error.response?.data?.message) {
                    errorMessage = `Error: ${error.response.data.message}`;
                }
                
                setMessages([{ role: 'system', content: errorMessage }]);
            }
            setIsLoading(false);
        };
        startSession();
    }, [user, skillId, selectedEvaluationMode]); // Re-run when the user object, skillId, or evaluation mode changes

    useEffect(() => {
        const fetchProgress = async () => {
            if (scenarioInfo) {
                const progress = await progressService.getSkillProgress(scenarioInfo.skillId);
                if (progress && progress.patientSimProgress && progress.patientSimProgress.completedSteps) {
                    const completed = progress.patientSimProgress.completedSteps.map(step => step.stepId);
                    setCompletedObjectives(completed.map(objective => ({ objective, completedAt: new Date() })));
                }
            }
        };
        fetchProgress();
    }, [scenarioInfo]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !sessionId) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await sendChatMessage(sessionId, input);
            const { patientResponse, completedObjectives: updatedObjectives, relevanceCheck } = response;
            const modelMessage = { role: 'model', content: patientResponse };
            setMessages(prev => [...prev, modelMessage]);
            
            // Store relevance check for feedback display
            if (relevanceCheck) {
                setLastRelevanceCheck(relevanceCheck);
            }
            
            // Update completed objectives
            if (updatedObjectives) {
                setCompletedObjectives(updatedObjectives);
                
                // Check if all objectives are complete
                if (scenarioInfo && scenarioInfo.learningObjectives) {
                    const allComplete = scenarioInfo.learningObjectives.every(objective =>
                        updatedObjectives.some(completed => completed.objective === objective)
                    );
                    setAllObjectivesComplete(allComplete);
                }
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage = { role: 'system', content: "Error: Could not get a response." };
            setMessages(prev => [...prev, errorMessage]);
        }
        setIsLoading(false);
    };

    const handleCompleteSession = () => {
        setShowRatingModal(true);
    };

    const handleSubmitRating = async () => {
        try {
            // Validate required data before making API call
            if (!sessionId) {
                console.error('Cannot save chat progress: No valid session ID');
                setShowRatingModal(false);
                setIsSessionComplete(true);
                return;
            }

            if (!skillId) {
                console.error('Cannot save chat progress: No skill ID');
                setShowRatingModal(false);
                setIsSessionComplete(true);
                return;
            }

            const duration = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
            
            console.log('Attempting to save chat progress:', {
                skillId,
                sessionId,
                sessionRating,
                duration
            });
            
            await progressService.updateChatSimProgress(skillId, sessionId, sessionRating, duration);
            
            // Award star for completing chat session
            try {
                await progressService.awardStar(skillId, 'chat');
                console.log('Star awarded for chat completion');
            } catch (starError) {
                console.log('Star may already exist for this skill/mode combination');
            }
            
            setIsSessionComplete(true);
            setShowRatingModal(false);
            console.log('Chat session progress saved successfully');
        } catch (error) {
            console.error('Error saving chat session progress:', error);
            console.error('Failed progress data:', {
                skillId,
                sessionId,
                sessionRating,
                duration: sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0
            });
            // Still complete the session even if progress saving fails
            setIsSessionComplete(true);
            setShowRatingModal(false);
        }
    };

    const handleBackToHub = () => {
        // Navigate back to learning hub or skills page
        window.location.href = '/skills';
    };

    const handleModeSelection = (mode) => {
        setSelectedEvaluationMode(mode);
        setShowModeSelection(false);
    };

    // Show error if no skillId is provided
    if (!skillId) {
        return (
            <Layout className="chat-page">
                <div className="error-container">
                    <h2>No Skill Selected</h2>
                    <p>Please select a skill to start the chat practice session.</p>
                    <button onClick={() => window.location.href = '/skills'} className="back-to-skills-btn">
                        Back to Skills
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout className="chat-page">
            {showModeSelection && (
                <div className="mode-selection-overlay">
                    <div className="mode-selection-modal">
                        <h2>Choose Your Evaluation Mode</h2>
                        <p>Select how you want to be evaluated during your practice session:</p>
                        
                        <div className="mode-options">
                            <div 
                                className="mode-option"
                                onClick={() => handleModeSelection('broad')}
                            >
                                <div className="mode-icon">😊</div>
                                <h3>Easy Mode</h3>
                                <p>Practice without visible task list. Focus on natural conversation and general skill demonstration.</p>
                                <ul>
                                    <li>No visible checklist</li>
                                    <li>Natural conversation flow</li>
                                    <li>General skill practice</li>
                                    <li>Less structured approach</li>
                                </ul>
                                <button className="select-mode-btn">Select Easy Mode</button>
                            </div>

                            <div 
                                className="mode-option"
                                onClick={() => handleModeSelection('specific')}
                            >
                                <div className="mode-icon">📝</div>
                                <h3>Hard Mode</h3>
                                <p>Practice with visible task list and specific procedural steps that must be completed in the correct order.</p>
                                <ul>
                                    <li>Visible task checklist</li>
                                    <li>Step-by-step procedure</li>
                                    <li>Correct sequence required</li>
                                    <li>Detailed skill demonstration</li>
                                </ul>
                                <button className="select-mode-btn">Select Hard Mode</button>
                            </div>

                            <div 
                                className="mode-option"
                                onClick={() => handleModeSelection('extraHard')}
                            >
                                <div className="mode-icon">🔥</div>
                                <h3>Extra Hard Mode</h3>
                                <p>Practice with no visible checklist but specific steps must be completed in the correct sequential order.</p>
                                <ul>
                                    <li>No visible checklist</li>
                                    <li>Strict order requirements</li>
                                    <li>Memory-based execution</li>
                                    <li>Expert-level challenge</li>
                                </ul>
                                <button className="select-mode-btn">Select Extra Hard Mode</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="chat-main-content">
                {scenarioInfo && (
                    <div className="scenario-info">
                        <h2 id="chat-page-h2">{scenarioInfo.skillName}</h2>
                        <p id="chat-page-p"><strong id="chat-page-patient-strong">Patient:</strong> {scenarioInfo.patientName}, {scenarioInfo.patientAge} years old</p>
                    </div>
                )}
            
            {scenarioInfo && scenarioInfo.learningObjectives && selectedEvaluationMode === 'specific' && (
                <div className="learning-objectives-tab">
                    <div className="objectives-header">
                        <strong id="chat-page-learning-objectives-strong">Task List</strong>
                        <div className="objectives-toggle">
                            <button 
                                className={`toggle-btn ${!showSpecificObjectives ? 'active' : ''}`}
                                onClick={() => setShowSpecificObjectives(false)}
                            >
                                Broad
                            </button>
                            <button 
                                className={`toggle-btn ${showSpecificObjectives ? 'active' : ''}`}
                                onClick={() => setShowSpecificObjectives(true)}
                            >
                                Specific
                            </button>
                        </div>
                    </div>
                    <div className="objectives-content">
                        <ul id="chat-page-ul">
                            {(showSpecificObjectives && scenarioInfo.specificSteps ? scenarioInfo.specificSteps : scenarioInfo.learningObjectives).map((objective, index) => {
                                const isCompleted = completedObjectives.some(completed => completed.objective === objective);
                                return (
                                    <li 
                                        key={index} 
                                        id={`chat-page-li-${index}`}
                                        className={isCompleted ? 'objective-completed' : 'objective-pending'}
                                        style={{
                                            color: isCompleted ? '#4caf50' : '#666',
                                            textDecoration: isCompleted ? 'line-through' : 'none'
                                        }}
                                    >
                                        {isCompleted ? '✅' : '⏳'} {objective}
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="objectives-progress">
                            <strong>Progress: {completedObjectives.length} / {scenarioInfo.learningObjectives.length} objectives completed</strong>
                        </div>
                        {showSpecificObjectives && scenarioInfo.specificSteps && (
                            <div className="objectives-note">
                                <small>Showing specific procedural steps for this skill</small>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
                {lastRelevanceCheck && !lastRelevanceCheck.isRelevant && (
                <div className="relevance-feedback-message">
                    <div className="feedback-banner off-topic">
                        <h3>⚠️ Stay Focused on the Skill</h3>
                        <p><strong>Feedback:</strong> {lastRelevanceCheck.reason}</p>
                        {lastRelevanceCheck.redirection && (
                            <p><strong>Guidance:</strong> {lastRelevanceCheck.redirection}</p>
                        )}
                        <button 
                            onClick={() => setLastRelevanceCheck(null)} 
                            className="dismiss-feedback-btn"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            {allObjectivesComplete && !isSessionComplete && (
                <div className="objectives-complete-message">
                    <div className="success-banner">
                        <h3>🎉 All Learning Objectives Completed!</h3>
                        <p>Congratulations! You have successfully demonstrated all the learning objectives for this scenario.</p>
                        <p>You can continue the conversation or complete the session when you're ready.</p>
                    </div>
                </div>
            )}
            
            {!isSessionComplete && (
                <div className="session-controls">
                    <button 
                        onClick={handleCompleteSession}
                        className="complete-session-btn"
                        disabled={!sessionId || messages.length < 2}
                    >
                        Complete Session
                    </button>
                </div>
            )}
            
            <div className="chat-container" ref={chatContainerRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <p id={`chat-page-message-p-${index}`}><strong id={`chat-page-message-strong-${index}`}>{msg.role === 'model' ? 'Patient' : 'You'}:</strong> {msg.content}</p>
                    </div>
                ))}
                {isLoading && <div className="chat-message system"><p id="chat-page-loading-p"><i id="chat-page-loading-i">Typing...</i></p></div>}
            </div>
            
            {!isSessionComplete && (
                <form onSubmit={handleSendMessage} className="chat-input-form">
                    <input
                        id="chat-page-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading || !sessionId}
                    />
                    <button id="chat-page-send-button" type="submit" disabled={isLoading || !sessionId}>Send</button>
                </form>
            )}
            
            {isSessionComplete && (
                <div className="session-complete">
                    <h3>🎉 Chat Session Complete!</h3>
                    <p>Thank you for completing the chat simulation for {scenarioInfo?.skillName}.</p>
                    <button onClick={handleBackToHub} className="back-to-hub-btn">
                        Back to Learning Hub
                    </button>
                </div>
            )}
            
            {showRatingModal && (
                <div className="rating-modal-overlay">
                    <div className="rating-modal">
                        <h3>Rate Your Session</h3>
                        <p>How would you rate your chat simulation experience?</p>
                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    className={`star ${sessionRating >= star ? 'active' : ''}`}
                                    onClick={() => setSessionRating(star)}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                        <div className="rating-actions">
                            <button onClick={() => setShowRatingModal(false)} className="cancel-btn">
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmitRating} 
                                className="submit-btn"
                                disabled={sessionRating === 0}
                            >
                                Submit Rating
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </Layout>
    );
};

export default ChatPage;

