// CNA_APP/src/api/chatApi.js
import axios from 'axios';
import API_URL from '../config/apiConfig.js';

// Base URL for your backend API - now using robust configuration

/**
 * Initiates a new patient simulation chat session on the backend.
 * @param {string} userId - The ID of the currently authenticated user.
 * @param {string} skillId - The skill ID to determine which scenario to use.
 * @param {string} evaluationMode - The evaluation mode ('broad' or 'specific').
 * @returns {Promise<object>} - A promise that resolves to the session ID and initial patient message.
 */
export const startChatSession = async (userId, skillId, evaluationMode = 'broad') => {
  try {
    // Use withCredentials to ensure the browser sends the http-only cookie
    const response = await axios.post(`${API_URL}/chat/start`, { userId, skillId, evaluationMode }, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error starting chat session:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Sends a student's message to the patient simulator and receives the AI patient's response.
 * @param {string} sessionId - The ID of the current chat session.
 * @param {string} studentMessage - The message typed by the student.
 * @returns {Promise<object>} - A promise that resolves to the patient's response.
 */
export const sendChatMessage = async (sessionId, studentMessage) => {
  try {
    // Use withCredentials to ensure the browser sends the http-only cookie
    const response = await axios.post(`${API_URL}/chat/message`,
      { sessionId, studentMessage },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data?.message || error.message);
    throw error;
  }
};