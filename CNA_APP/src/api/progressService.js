import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const progressService = {
  // Get user's progress summary
  getProgressSummary: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/progress/summary`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching progress summary:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  // Get progress for a specific skill
  getSkillProgress: async (skillId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/progress/skill/${skillId}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching skill progress:', error);
      throw error;
    }
  },

  // Initialize progress for a skill
  initializeSkillProgress: async (skillId, totalSteps, totalChatSessions = 1) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/progress/skill/${skillId}/initialize`, {
        totalSteps,
        totalChatSessions
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error initializing skill progress:', error);
      throw error;
    }
  },

  // Update patient simulation progress
  updatePatientSimProgress: async (skillId, totalSteps, completedSteps, score, timeSpent) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/progress/skill/${skillId}/patient-sim`, {
        totalSteps,
        completedSteps,
        score,
        timeSpent
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error updating patient simulation progress:', error);
      throw error;
    }
  },

  // Update chat simulation progress
  updateChatSimProgress: async (skillId, sessionId, rating, duration) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/progress/skill/${skillId}/chat-sim`, {
        sessionId,
        rating,
        duration
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error updating chat simulation progress:', error);
      throw error;
    }
  },

  // Reset progress for a specific skill
  resetSkillProgress: async (skillId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/progress/skill/${skillId}/reset`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error resetting skill progress:', error);
      throw error;
    }
  },

  // Get leaderboard for a skill
  getSkillLeaderboard: async (skillId, limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/progress/leaderboard/${skillId}?limit=${limit}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },

  // Get aggregate statistics (admin)
  getStatistics: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/progress/stats`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
};

export default progressService;