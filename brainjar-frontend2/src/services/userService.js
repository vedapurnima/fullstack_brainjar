import api from './api';

const userService = {
  // Get user profile by ID
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Get current user's profile
  getCurrentUserProfile: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (profileData) => {
    try {
      const response = await api.put('/users/me', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Get problems created by a specific user
  getUserProblems: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/problems`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching user problems:', error);
      throw error;
    }
  },

  // Get user's solutions
  getUserSolutions: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/solutions`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching user solutions:', error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (query) => {
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
};

export default userService;
