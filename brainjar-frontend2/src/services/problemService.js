import api from './api';

// Helper function to get current user data safely
const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      throw new Error('No user data found');
    }
    const user = JSON.parse(userData);
    if (!user || !user.id) {
      throw new Error('Invalid user data');
    }
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw new Error('Authentication required');
  }
};

const problemService = {
  // Get all problems for the authenticated user
  getProblems: async () => {
    try {
      const user = getCurrentUser();
      const response = await api.get(`/problems?user_id=${user.id}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching problems:', error);
      throw error;
    }
  },

  // Get all problems from all users (global view)
  getAllProblems: async () => {
    try {
      // For now, we'll use the same endpoint but later this could be different
      // If backend supports a global problems endpoint, change this
      const response = await api.get('/problems');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching all problems:', error);
      throw error;
    }
  },

  // Get a specific problem by ID
  getProblem: async (problemId) => {
    try {
      const user = getCurrentUser();
      const response = await api.get(`/problems/${problemId}?user_id=${user.id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching problem:', error);
      throw error;
    }
  },

  // Create a new problem
  createProblem: async (problemData) => {
    try {
      const user = getCurrentUser();
      const response = await api.post(`/problems?user_id=${user.id}`, problemData);
      return response.data;
    } catch (error) {
      console.error('Error creating problem:', error);
      throw error;
    }
  },

  // Update an existing problem
  updateProblem: async (problemId, problemData) => {
    try {
      const user = getCurrentUser();
      const response = await api.put(`/problems/${problemId}?user_id=${user.id}`, problemData);
      return response.data;
    } catch (error) {
      console.error('Error updating problem:', error);
      throw error;
    }
  },

  // Delete a problem
  deleteProblem: async (problemId) => {
    try {
      const user = getCurrentUser();
      await api.delete(`/problems/${problemId}?user_id=${user.id}`);
      return true;
    } catch (error) {
      console.error('Error deleting problem:', error);
      throw error;
    }
  },

  // Submit a solution to a problem
  submitSolution: async (problemId, solution) => {
    try {
      const response = await api.post(`/problems/${problemId}/solve`, {
        solution: solution,
        submitted_at: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting solution:', error);
      throw error;
    }
  },

  // Get solutions for a problem
  getProblemSolutions: async (problemId) => {
    try {
      const response = await api.get(`/problems/${problemId}/solutions`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching solutions:', error);
      throw error;
    }
  },

  // Submit feedback/rating for a problem
  submitFeedback: async (problemId, feedbackData) => {
    try {
      const response = await api.post(`/problems/${problemId}/feedback`, {
        rating: feedbackData.rating,
        comment: feedbackData.comment || '',
        submitted_at: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  // Get feedback for a problem
  getProblemFeedback: async (problemId) => {
    try {
      const response = await api.get(`/problems/${problemId}/feedback`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  },

  // Get user's own solutions
  getUserSolutions: async () => {
    try {
      const response = await api.get('/solutions/my');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching user solutions:', error);
      throw error;
    }
  }
};

export default problemService;
