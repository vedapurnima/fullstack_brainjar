import api from './api';

const friendService = {
  // Get friend suggestions
  getFriendSuggestions: async () => {
    try {
      const response = await api.get('/api/friends/suggestions');
      return response.data;
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
      throw error;
    }
  },

  // Get all users for friend suggestions
  getAllUsers: async () => {
    try {
      const response = await api.get('/api/users/suggestions');
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },

  // Send friend request
  sendFriendRequest: async (friendId) => {
    try {
      const response = await api.post('/api/friends/request', {
        friend_id: friendId
      });
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  },

  // Get friend requests
  getFriendRequests: async () => {
    try {
      const response = await api.get('/api/friends/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      throw error;
    }
  },

  // Accept/decline friend request
  respondToFriendRequest: async (requestId, status) => {
    try {
      const response = await api.patch(`/api/friends/${requestId}`, {
        status: status // 'accepted' or 'declined'
      });
      return response.data;
    } catch (error) {
      console.error('Error responding to friend request:', error);
      throw error;
    }
  },

  // Get friends list
  getFriends: async () => {
    try {
      const response = await api.get('/api/friends');
      return response.data;
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw error;
    }
  },
};

export default friendService;
