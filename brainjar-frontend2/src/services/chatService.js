import api from './api';

const chatService = {
  // Get messages between two users
  getMessages: async (userId) => {
    try {
      const response = await api.get(`/api/chat/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (receiverId, message) => {
    try {
      const response = await api.post('/api/chat', {
        receiver_id: receiverId,
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get all conversations for current user
  getConversations: async () => {
    try {
      const response = await api.get('/api/chat/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Poll for new messages (simple polling implementation)
  pollMessages: async (userId, lastMessageTime) => {
    try {
      const response = await api.get(`/api/chat/${userId}?since=${lastMessageTime}`);
      return response.data;
    } catch (error) {
      console.error('Error polling messages:', error);
      return [];
    }
  },
};

export default chatService;
