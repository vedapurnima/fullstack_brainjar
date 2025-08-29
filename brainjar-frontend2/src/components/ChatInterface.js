import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  X, 
  User, 
  ArrowLeft,
  Search,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import chatService from '../services/chatService';
import './ChatInterface.css';

const ChatInterface = ({ isOpen, onClose, initialUserId, initialUsername }) => {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const conversationsList = await chatService.getConversations();
      setConversations(conversationsList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  // Fetch messages for a specific chat
  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      const messagesList = await chatService.getMessages(userId);
      setMessages(messagesList);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await chatService.sendMessage(activeChat.user_id, messageText);
      
      // Add the message to local state immediately
      setMessages(prev => [...prev, sentMessage]);
      scrollToBottom();
      
      // Update conversation list
      setConversations(prev => 
        prev.map(conv => 
          conv.user_id === activeChat.user_id 
            ? { ...conv, last_message: messageText, last_message_time: new Date().toISOString() }
            : conv
        )
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message on failure
    } finally {
      setSending(false);
    }
  };

  // Start a new chat
  const startChat = (userId, username) => {
    const existingConv = conversations.find(conv => conv.user_id === userId);
    if (existingConv) {
      setActiveChat(existingConv);
      fetchMessages(userId);
    } else {
      const newConv = {
        user_id: userId,
        username: username,
        last_message: null,
        last_message_time: null,
        unread_count: 0
      };
      setActiveChat(newConv);
      setMessages([]);
      setConversations(prev => [newConv, ...prev]);
    }
  };

  // Poll for new messages
  const startPolling = () => {
    if (activeChat && pollIntervalRef.current === null) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const latestMessages = await chatService.getMessages(activeChat.user_id);
          if (latestMessages.length > messages.length) {
            setMessages(latestMessages);
            scrollToBottom();
          }
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      }, 3000); // Poll every 3 seconds
    }
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Effects
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  // Handle initial user selection
  useEffect(() => {
    if (isOpen && initialUserId && initialUsername) {
      // Start a chat with the specified user
      const initialChat = {
        user_id: initialUserId,
        username: initialUsername
      };
      startChat(initialChat);
    }
  }, [isOpen, initialUserId, initialUsername]);

  useEffect(() => {
    if (activeChat) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return stopPolling;
  }, [activeChat, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format message time
  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="chat-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="chat-interface"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              {activeChat && (
                <button
                  className="back-btn"
                  onClick={() => setActiveChat(null)}
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <MessageCircle size={24} />
              <h3>{activeChat ? activeChat.username : 'Messages'}</h3>
            </div>
            <div className="chat-header-right">
              {activeChat && (
                <>
                  <button className="header-action-btn">
                    <Phone size={18} />
                  </button>
                  <button className="header-action-btn">
                    <Video size={18} />
                  </button>
                  <button className="header-action-btn">
                    <MoreVertical size={18} />
                  </button>
                </>
              )}
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="chat-content">
            {!activeChat ? (
              // Conversations List
              <div className="conversations-list">
                <div className="conversations-search">
                  <div className="search-input-wrapper">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="conversations">
                  {filteredConversations.length === 0 ? (
                    <div className="no-conversations">
                      <MessageCircle size={48} />
                      <h4>No conversations yet</h4>
                      <p>Start chatting with your coding friends!</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.user_id}
                        className="conversation-item"
                        onClick={() => {
                          setActiveChat(conversation);
                          fetchMessages(conversation.user_id);
                        }}
                      >
                        <div className="conversation-avatar">
                          <User size={20} />
                        </div>
                        <div className="conversation-details">
                          <div className="conversation-header">
                            <h4>{conversation.username}</h4>
                            <span className="conversation-time">
                              {formatMessageTime(conversation.last_message_time)}
                            </span>
                          </div>
                          <div className="conversation-preview">
                            <p>{conversation.last_message || 'No messages yet'}</p>
                            {conversation.unread_count > 0 && (
                              <span className="unread-badge">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              // Active Chat
              <div className="active-chat">
                <div className="messages-container">
                  {loading ? (
                    <div className="messages-loading">
                      <div className="loading-spinner"></div>
                      <p>Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="no-messages">
                      <MessageCircle size={48} />
                      <h4>No messages yet</h4>
                      <p>Start your conversation with {activeChat.username}!</p>
                    </div>
                  ) : (
                    <div className="messages">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          className={`message ${message.is_own ? 'own' : 'other'}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="message-content">
                            <p>{message.message}</p>
                            <span className="message-time">
                              {formatMessageTime(message.created_at)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form className="message-input-form" onSubmit={sendMessage}>
                  <div className="message-input-wrapper">
                    <input
                      type="text"
                      placeholder={`Message ${activeChat.username}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="send-btn"
                    >
                      {sending ? (
                        <div className="mini-spinner"></div>
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Export both the main component and a hook for external usage
export const useChatInterface = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatData, setChatData] = useState(null);

  const openChat = (userId, username) => {
    setChatData({ userId, username });
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setChatData(null);
  };

  return {
    isOpen,
    chatData,
    openChat,
    closeChat,
    ChatComponent: () => (
      <ChatInterface
        isOpen={isOpen}
        onClose={closeChat}
        initialChat={chatData}
      />
    ),
  };
};

export default ChatInterface;
