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
      const response = await api.get('/api/problems');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching problems:', error);
      throw error;
    }
  },

  // Get all problems from all users (global view)
  getAllProblems: async () => {
    try {
      const response = await api.get('/api/problems');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching all problems:', error);
      throw error;
    }
  },

  // Get a specific problem by ID
  getProblem: async (problemId) => {
    try {
      const response = await api.get(`/api/problems/${problemId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching problem:', error);
      throw error;
    }
  },

  // Create a new problem
  createProblem: async (problemData) => {
    try {
      const response = await api.post('/api/problems', problemData);
      return response.data;
    } catch (error) {
      console.error('Error creating problem:', error);
      throw error;
    }
  },

  // Update an existing problem
  updateProblem: async (problemId, problemData) => {
    try {
      const response = await api.put(`/api/problems/${problemId}`, problemData);
      return response.data;
    } catch (error) {
      console.error('Error updating problem:', error);
      throw error;
    }
  },

  // Delete a problem
  deleteProblem: async (problemId) => {
    try {
      await api.delete(`/api/problems/${problemId}`);
      return true;
    } catch (error) {
      console.error('Error deleting problem:', error);
      throw error;
    }
  },

  // Submit a solution to a problem
  submitSolution: async (problemId, solution) => {
    try {
      const response = await api.post(`/api/problems/${problemId}/solve`, {
        solution: solution,
        submitted_at: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting solution:', error);
      throw error;
    }
  },

  // Mark problem as solved
  markProblemSolved: async (problemId) => {
    try {
      const response = await api.post(`/api/streaks/update-for-problem`, {
        problem_id: problemId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking problem as solved:', error);
      throw error;
    }
  },

  // Get solutions for a problem
  getProblemSolutions: async (problemId) => {
    try {
      const response = await api.get(`/api/problems/${problemId}/solutions`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching solutions:', error);
      throw error;
    }
  },

  // Submit feedback/rating for a problem
  submitFeedback: async (problemId, feedbackData) => {
    try {
      const response = await api.post(`/api/problems/${problemId}/feedback`, {
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
      const response = await api.get(`/api/problems/${problemId}/feedback`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  },

  // Get user's own solutions
  getUserSolutions: async () => {
    try {
      const response = await api.get('/api/solutions/my');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching user solutions:', error);
      throw error;
    }
  }
};

export default problemService;
