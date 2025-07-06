import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../api/AuthContext'; // Import the useAuth hook
import { startChatSession, sendChatMessage } from '../api/chatApi';
import '../styles/ChatPage.css';
import NavBar from '../components/NavBar';

const ChatPage = () => {
    const { user } = useAuth(); // Get the authenticated user
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        const startSession = async () => {
            if (!user) return; // Don't start if there is no user

            setIsLoading(true);
            try {
                const { sessionId, patientInitialResponse } = await startChatSession(user._id);
                setSessionId(sessionId);
                setMessages([{ role: 'model', content: patientInitialResponse }]);
            } catch (error) {
                console.error("Failed to start chat session:", error);
                setMessages([{ role: 'system', content: "Error: Could not start the chat session." }]);
            }
            setIsLoading(false);
        };
        startSession();
    }, [user]); // Re-run when the user object is available

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
        <div className="chat-page">
            <NavBar />
            <div className="chat-container" ref={chatContainerRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <p><strong>{msg.role === 'model' ? 'Patient' : 'You'}:</strong> {msg.content}</p>
                    </div>
                ))}
                {isLoading && <div className="chat-message system"><p><i>Typing...</i></p></div>}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading || !sessionId}
                />
                <button type="submit" disabled={isLoading || !sessionId}>Send</button>
            </form>
        </div>
    );
};

export default ChatPage;

