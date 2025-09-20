import axios from 'axios';
import API_URL from '../config/apiConfig.js';

/**
 * Generates CNA certification quiz questions using the new session-based system
 * @param {Object} config - Quiz configuration options
 * @returns {Promise<Object>} - Quiz session data
 */
export const generateQuizQuestions = async (config = {}) => {
  try {
    const {
      questionCount = 30,
      competencyRatios = {
        physicalCareSkills: 64,
        psychosocialCareSkills: 10,
        roleOfNurseAide: 26
      },
      difficulty = 'intermediate',
      gradingMode = 'immediate'
    } = config;

    const response = await axios.post(`${API_URL}/quiz/generate`, {
      questionCount,
      quizType: 'practice',
      gradingMode,
      quizComposition: {
        questionCount,
        competencyRatios
      },
      difficultySettings: {
        preferredDifficulty: difficulty
      }
    }, { 
      withCredentials: true,
      timeout: 60000 // 60 second timeout for question generation
    });
    
    // Convert session format to expected format for compatibility
    const sessionData = response.data;
    return {
      sessionId: sessionData.sessionId,
      questions: [], // Questions will be loaded one by one
      quizId: sessionData.sessionId, // Use sessionId as quizId for compatibility
      totalQuestions: sessionData.totalQuestions || 30,
      firstQuestion: sessionData.currentQuestion,
      gradingMode: sessionData.configuration?.gradingMode || gradingMode
    };
  } catch (error) {
    console.error('Error generating quiz questions:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Fetches a specific question by position for a quiz session
 * @param {string} sessionId - Quiz session ID
 * @param {number} position - Question position (0-indexed)
 * @returns {Promise<Object>} - Question data
 */
export const getQuestionByPosition = async (sessionId, position) => {
  try {
    const response = await axios.get(`${API_URL}/quiz/session/${sessionId}/question`, {
      params: { position },
      withCredentials: true,
      timeout: 10000
    });
    
    return response.data.question;
  } catch (error) {
    console.error('Error fetching question by position:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Submits an answer for a single question in a quiz session
 * @param {string} sessionId - The ID of the current quiz session
 * @param {string} questionId - The ID of the question being answered
 * @param {string} selectedAnswer - The answer selected by the user (e.g., 'A')
 * @param {number} timeSpent - Time spent on the question in seconds
 * @returns {Promise<Object>} - Feedback for the answer and the next question
 */
export const submitAnswer = async (sessionId, questionId, selectedAnswer, timeSpent) => {
  try {
    const response = await axios.post(`${API_URL}/quiz/session/answer`, {
      sessionId,
      questionId,
      selectedAnswer,
      timeSpent
    }, {
      withCredentials: true,
      timeout: 15000
    });
    
    return response.data;
  } catch (error) {
    console.error('Error submitting answer:', error.response?.data?.message || error.message);
    throw error;
  }
};""

/**
 * Submits quiz results and gets detailed feedback
 * @param {Array} answers - Array of user's selected answers
 * @param {String} quizId - Quiz ID for the current quiz
 * @param {Date} timeStarted - When the quiz was started
 * @param {String} originalQuizId - If this is a retake, the original quiz ID
 * @returns {Promise<Object>} - Detailed results and feedback
 */
export const submitQuizResults = async (answers, quizId, timeStarted = null, originalQuizId = null) => {
  try {
    const response = await axios.post(`${API_URL}/quiz/submit`, {
      answers,
      quizId,
      timeStarted: timeStarted?.toISOString() || new Date().toISOString(),
      originalQuizId
    }, { 
      withCredentials: true 
    });
    
    return response.data;
  } catch (error) {
    console.error('Error submitting quiz results:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Gets user's quiz history with pagination
 * @param {Number} page - Page number (default 1)
 * @param {Number} limit - Items per page (default 10)
 * @returns {Promise<Object>} - Quiz history and statistics
 */
export const getQuizHistory = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/quiz/history`, {
      params: { page, limit },
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting quiz history:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Gets detailed results for a specific quiz
 * @param {String} quizId - The quiz ID to get details for
 * @returns {Promise<Object>} - Detailed quiz results
 */
export const getQuizDetails = async (quizId) => {
  try {
    const response = await axios.get(`${API_URL}/quiz/${quizId}`, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting quiz details:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Sets up a retake of a previous quiz
 * @param {String} quizId - The original quiz ID to retake
 * @returns {Promise<Object>} - The questions for retaking
 */
export const retakeQuiz = async (quizId) => {
  try {
    const response = await axios.post(`${API_URL}/quiz/${quizId}/retake`, {}, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error setting up quiz retake:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Gets detailed quiz results for review
 * @param {String} quizId - ID of the quiz to get results for
 * @returns {Promise<Object>} - Detailed quiz results with questions, answers, and analysis
 */
export const getQuizResults = async (quizId) => {
  try {
    const response = await axios.get(`${API_URL}/quiz/${quizId}/results`, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting quiz results:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**

 * Submits a single answer and gets immediate feedback (for instant grading)
 * @param {string} sessionId - Quiz session ID
 * @param {string} questionId - Question ID
 * @param {string} selectedAnswer - Selected answer (A, B, C, or D)
 * @param {number} timeSpent - Time spent on question in seconds
 * @returns {Promise<Object>} - Immediate feedback including correctness and explanation
 */
export const submitInstantAnswer = async (sessionId, questionId, selectedAnswer, timeSpent = 0) => {
  try {
    const response = await axios.post(`${API_URL}/quiz/session/answer`, {
      sessionId,
      questionId,
      selectedAnswer,
      timeSpent
    }, { 
      withCredentials: true,
      timeout: 10000

    });
    
    return response.data;
  } catch (error) {

    console.error('Error submitting instant answer:', error.response?.data?.message || error.message);

    throw error;
  }
};

/**

 * Gets user's quiz preferences
 * @returns {Promise<Object>} - User preferences including instant grading setting
 */
export const getUserPreferences = async () => {
  try {
    const response = await axios.get(`${API_URL}/quiz/preferences`, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting user preferences:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Updates user's quiz preferences
 * @param {Object} preferences - Preference updates to apply
 * @returns {Promise<Object>} - Updated preferences
 */
export const updateUserPreferences = async (preferences) => {
  try {
    const response = await axios.put(`${API_URL}/quiz/preferences`, preferences, {
      withCredentials: true

    });
    
    return response.data;
  } catch (error) {

    console.error('Error updating user preferences:', error.response?.data?.message || error.message);

    throw error;
  }
};