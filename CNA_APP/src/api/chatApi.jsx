// CNA_APP/src/api/chatApi.js
import axios from 'axios';

// Base URL for your backend API (ensure this matches your backend's running port)
// Your backend's index.js should be listening on this port.
const API_URL = 'http://localhost:5000/api';

/**
 * Helper function to retrieve the JWT token from local storage
 * and format it for the Authorization header.
 * Assumes the token is stored as 'token' in localStorage.
 * @returns {object} - An object containing the Content-Type and Authorization headers.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); // Retrieve JWT from local storage
  return {
    'Content-Type': 'application/json', // Specify content type as JSON
    'Authorization': token ? `Bearer ${token}` : '' // Attach JWT as Bearer token
  };
};

/**
 * Initiates a new patient simulation chat session on the backend.
 * @param {string} userId - The ID of the currently authenticated user.
 * @returns {Promise<object>} - A promise that resolves to the session ID and initial patient message.
 * Expected backend response data: { sessionId: string, patientInitialResponse: string, message: string }
 */
export const startChatSession = async (userId) => {
  try {
    const response = await axios.post(`${API_URL}/chat/start`, { userId }, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error starting chat session:', error.response?.data?.message || error.message);
    throw error; // Re-throw the error for the calling component to handle
  }
};

/**
 * Sends a student's message to the patient simulator and receives the AI patient's response.
 * @param {string} sessionId - The ID of the current chat session.
 * @param {string} studentMessage - The message typed by the student.
 * @returns {Promise<object>} - A promise that resolves to the patient's response.
 * Expected backend response data: { patientResponse: string }
 */
export const sendChatMessage = async (sessionId, studentMessage) => {
  try {
    const response = await axios.post(`${API_URL}/chat/message`,
      { sessionId, studentMessage },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data?.message || error.message);
    throw error; // Re-throw the error for the calling component to handle
  }
};