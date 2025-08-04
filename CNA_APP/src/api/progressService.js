import axios from 'axios';
import API_URL from '../config/apiConfig.js';

const API_BASE_URL = API_URL;

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

  // Award star for lesson completion (fallback implementation)
  awardStar: async (skillId, lessonType) => {
    try {
      // Try the backend endpoint first (if it exists)
      const response = await axios.post(`${API_BASE_URL}/progress/stars/award`, {
        skillId,
        lessonType // 'chat' or 'simulation'
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      // Backend endpoint doesn't exist, use localStorage fallback
      console.log('Star award endpoint not available, using local storage fallback');
      const starKey = `star_${skillId}_${lessonType}`;
      const existingStar = localStorage.getItem(starKey);
      
      if (!existingStar) {
        localStorage.setItem(starKey, JSON.stringify({
          skillId,
          lessonType,
          awardedAt: new Date().toISOString()
        }));
        
        // Update total count
        const currentCount = parseInt(localStorage.getItem('totalStars') || '0');
        localStorage.setItem('totalStars', (currentCount + 1).toString());
        
        return { success: true, message: 'Star awarded locally' };
      }
      
      return { success: true, message: 'Star already exists' };
    }
  },

  // Get user's star count (fallback implementation)
  getStarCount: async () => {
    try {
      // Try the backend endpoint first (if it exists)
      const response = await axios.get(`${API_BASE_URL}/progress/stars`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      // Backend endpoint doesn't exist, use localStorage fallback
      console.log('Star count endpoint not available, using local storage fallback');
      const totalStars = parseInt(localStorage.getItem('totalStars') || '0');
      
      // Get all individual stars for detailed information
      const stars = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('star_')) {
          try {
            const starData = JSON.parse(localStorage.getItem(key));
            stars.push(starData);
          } catch (e) {
            // Invalid star data, ignore
          }
        }
      }
      
      return {
        totalStars,
        stars,
        message: 'Using local storage fallback'
      };
    }
  },

  // Sync stars with existing progress (fallback implementation)
  syncStarsWithProgress: async () => {
    try {
      // Try the backend endpoint first (if it exists)
      const response = await axios.post(`${API_BASE_URL}/progress/stars/sync`, {}, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      // Backend endpoint doesn't exist, return success to continue with client-side sync
      console.log('Star sync endpoint not available, will use client-side sync');
      return { success: true, message: 'Backend sync not available, using client-side sync' };
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