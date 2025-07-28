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
    const chatContainerRef = useRef(null);

    // Get skillId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const skillId = urlParams.get('skillId') || 'hand-hygiene';

    useEffect(() => {
        const startSession = async () => {
            if (!user) return; // Don't start if there is no user

            setIsLoading(true);
            try {
                const { sessionId, patientInitialResponse, scenario } = await startChatSession(user._id, skillId);
                setSessionId(sessionId);
                setScenarioInfo(scenario);
                setSessionStartTime(Date.now());
                setMessages([{ role: 'model', content: patientInitialResponse }]);
            } catch (error) {
                console.error("Failed to start chat session:", error);
                setMessages([{ role: 'system', content: "Error: Could not start the chat session." }]);
            }
            setIsLoading(false);
        };
        startSession();
    }, [user, skillId]); // Re-run when the user object is available or skillId changes

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
            const { patientResponse, completedObjectives: updatedObjectives } = response;
            const modelMessage = { role: 'model', content: patientResponse };
            setMessages(prev => [...prev, modelMessage]);
            
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

    return (
        <Layout className="chat-page">
            {scenarioInfo && (
                <div className="scenario-info">
                    <h2 id="chat-page-h2">{scenarioInfo.skillName}</h2>
                    <p id="chat-page-p"><strong id="chat-page-patient-strong">Patient:</strong> {scenarioInfo.patientName}, {scenarioInfo.patientAge} years old</p>
                    {scenarioInfo.learningObjectives && (
                        <div className="learning-objectives">
                            <strong id="chat-page-learning-objectives-strong">Learning Objectives:</strong>
                            <ul id="chat-page-ul">
                                {scenarioInfo.learningObjectives.map((objective, index) => {
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
                        </div>
                    )}
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
        </Layout>
    );
};

export default ChatPage;

