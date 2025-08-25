import axios from 'axios';
import API_URL from '../config/apiConfig.js';

/**
 * Generates 30 CNA certification quiz questions using Gemini API
 * @returns {Promise<Array>} - Array of question objects with options and correct answers
 */
export const generateQuizQuestions = async () => {
  try {
    const response = await axios.post(`${API_URL}/quiz/generate`, {
      questionCount: 30,
      topic: 'CNA_CERTIFICATION'
    }, { 
      withCredentials: true,
      timeout: 60000 // 60 second timeout for question generation
    });
    
    return response.data.questions;
  } catch (error) {
    console.error('Error generating quiz questions:', error.response?.data?.message || error.message);
    throw error;
  }
};

/**
 * Submits quiz results and gets detailed feedback
 * @param {Array} answers - Array of user's selected answers
 * @param {Array} questions - Array of question objects
 * @param {Date} timeStarted - When the quiz was started
 * @param {String} originalQuizId - If this is a retake, the original quiz ID
 * @returns {Promise<Object>} - Detailed results and feedback
 */
export const submitQuizResults = async (answers, questions, timeStarted = null, originalQuizId = null) => {
  try {
    const response = await axios.post(`${API_URL}/quiz/submit`, {
      answers,
      questions,
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