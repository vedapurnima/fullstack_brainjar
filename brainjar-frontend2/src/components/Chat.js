import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Search, Users, Clock, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import './Chat.css';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.friend_id);
      // Auto-refresh messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(selectedConversation.friend_id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      // Mock conversations for now - replace with actual API call when backend is ready
      const mockConversations = [
        {
          friend_id: '123e4567-e89b-12d3-a456-426614174000',
          friend_username: 'alice_coder',
          friend_avatar_url: null,
          last_activity: new Date().toISOString(),
          unread_count: 2,
          last_message: 'Hey! How are you doing?',
          last_message_time: new Date().toISOString()
        },
        {
          friend_id: '456e7890-e89b-12d3-a456-426614174001',
          friend_username: 'bob_developer',
          friend_avatar_url: null,
          last_activity: new Date(Date.now() - 3600000).toISOString(),
          unread_count: 0,
          last_message: 'Thanks for the help!',
          last_message_time: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      setConversations(mockConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (friendId) => {
    try {
      // Mock messages for now - replace with actual API call when backend is ready
      const mockMessages = [
        {
          id: '1',
          sender_id: friendId,
          receiver_id: 'current_user',
          message: 'Hey! How are you doing?',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          sender_username: selectedConversation.friend_username,
          sender_avatar_url: null,
          is_read: false
        },
        {
          id: '2',
          sender_id: 'current_user',
          receiver_id: friendId,
          message: 'Hi! I\'m doing great, thanks! Working on some React components.',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          sender_username: 'You',
          sender_avatar_url: null,
          is_read: true
        },
        {
          id: '3',
          sender_id: friendId,
          receiver_id: 'current_user',
          message: 'That sounds awesome! I\'ve been working on some backend APIs myself.',
          created_at: new Date(Date.now() - 900000).toISOString(),
          sender_username: selectedConversation.friend_username,
          sender_avatar_url: null,
          is_read: false
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    
    try {
      // Mock sending message - replace with actual API call when backend is ready
      const mockNewMessage = {
        id: Date.now().toString(),
        sender_id: 'current_user',
        receiver_id: selectedConversation.friend_id,
        message: newMessage,
        created_at: new Date().toISOString(),
        sender_username: 'You',
        sender_avatar_url: null,
        is_read: true
      };

      setMessages(prev => [...prev, mockNewMessage]);
      setNewMessage('');
      
      // Update conversation in list
      setConversations(prev => 
        prev.map(conv => 
          conv.friend_id === selectedConversation.friend_id 
            ? { ...conv, last_message: newMessage, last_message_time: new Date().toISOString() }
            : conv
        )
      );

      toast.success('Message sent!');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.friend_username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>
          <MessageCircle size={24} />
          Messages
        </h1>
        <p>Stay connected with your coding friends!</p>
      </div>

      <div className="chat-container">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <div className="search-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <div className="empty-conversations">
                <Users size={48} />
                <h3>No conversations</h3>
                <p>Start chatting with your friends!</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <motion.div
                  key={conv.friend_id}
                  className={`conversation-item ${selectedConversation?.friend_id === conv.friend_id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="conversation-avatar">
                    {conv.friend_avatar_url ? (
                      <img src={conv.friend_avatar_url} alt={conv.friend_username} />
                    ) : (
                      <div className="avatar-initial">
                        {conv.friend_username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h4 className="friend-name">{conv.friend_username}</h4>
                      <span className="last-time">{formatTime(conv.last_activity)}</span>
                    </div>
                    
                    <div className="conversation-preview">
                      <p className="last-message">{conv.last_message}</p>
                      {conv.unread_count > 0 && (
                        <span className="unread-badge">{conv.unread_count}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedConversation ? (
            <>
              <div className="chat-header-bar">
                <div className="chat-user-info">
                  <div className="chat-user-avatar">
                    {selectedConversation.friend_avatar_url ? (
                      <img src={selectedConversation.friend_avatar_url} alt={selectedConversation.friend_username} />
                    ) : (
                      <div className="avatar-initial">
                        {selectedConversation.friend_username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3>{selectedConversation.friend_username}</h3>
                    <p className="online-status">Last seen {formatTime(selectedConversation.last_activity)}</p>
                  </div>
                </div>
              </div>

              <div className="messages-container">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={`message ${message.sender_id === 'current_user' ? 'sent' : 'received'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {message.sender_id !== 'current_user' && (
                      <div className="message-avatar">
                        <div className="avatar-initial">
                          {selectedConversation.friend_username[0].toUpperCase()}
                        </div>
                      </div>
                    )}
                    
                    <div className="message-content">
                      <div className="message-bubble">
                        <p>{message.message}</p>
                      </div>
                      <div className="message-info">
                        <span className="message-time">{formatTime(message.created_at)}</span>
                        {message.sender_id === 'current_user' && (
                          <CheckCheck 
                            size={14} 
                            className={`message-status ${message.is_read ? 'read' : 'delivered'}`}
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="message-input-container">
                <div className="message-input-wrapper">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="message-input"
                    rows="1"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    className={`send-button ${sendingMessage ? 'sending' : ''}`}
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <div className="mini-spinner"></div>
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <MessageCircle size={64} />
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
