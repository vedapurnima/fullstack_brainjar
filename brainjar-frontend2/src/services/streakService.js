import api from './api';

const streakService = {
  // Get current user's streak
  getStreak: async () => {
    try {
      const response = await api.get('/api/streaks');
      return response.data;
    } catch (error) {
      console.error('Error fetching streak:', error);
      throw error;
    }
  },

  // Update streak
  updateStreak: async (streakData) => {
    try {
      const response = await api.patch('/api/streaks', streakData);
      return response.data;
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  },

  // Get streak statistics
  getStreakStats: async () => {
    try {
      const response = await api.get('/api/streaks/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching streak stats:', error);
      throw error;
    }
  },

  // Update streak for problem solved
  updateStreakForProblem: async (problemId) => {
    try {
      const response = await api.post('/api/streaks/update-for-problem', {
        problem_id: problemId
      });
      return response.data;
    } catch (error) {
      console.error('Error updating streak for problem:', error);
      throw error;
    }
  },

  // Get streak leaderboard
  getStreakLeaderboard: async () => {
    try {
      const response = await api.get('/api/streaks/leaderboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching streak leaderboard:', error);
      throw error;
    }
  },
};

export default streakService;
