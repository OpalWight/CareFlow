import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../api/AuthContext'; // Import the useAuth hook
import { startChatSession, sendChatMessage } from '../api/chatApi';
import '../styles/ChatPage.css';
import Layout from '../components/Layout';

const ChatPage = () => {
    const { user } = useAuth(); // Get the authenticated user
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [scenarioInfo, setScenarioInfo] = useState(null);
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
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !sessionId) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const { patientResponse } = await sendChatMessage(sessionId, input);
            const modelMessage = { role: 'model', content: patientResponse };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage = { role: 'system', content: "Error: Could not get a response." };
            setMessages(prev => [...prev, errorMessage]);
        }
        setIsLoading(false);
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
                                {scenarioInfo.learningObjectives.map((objective, index) => (
                                    <li key={index} id={`chat-page-li-${index}`}>{objective}</li>
                                ))}
                            </ul>
                        </div>
                    )}
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
        </Layout>
    );
};

export default ChatPage;

