import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2, Maximize2, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your coding assistant. Ask me anything about algorithms, data structures, or programming concepts!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);
  const constraintsRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = async (userMessage) => {
    // Mock AI responses - In production, replace with actual AI API call
    const responses = [
      "That's a great question! Let me help you understand this concept better.",
      "Here's how I'd approach this problem: First, consider the time complexity...",
      "This is a common algorithm challenge. The key insight is to use the right data structure.",
      "Good thinking! This pattern often appears in coding interviews. Here's the approach...",
      "Let me break this down step by step for you.",
      "That's an interesting problem! Have you considered using a hash map for this?",
      "This looks like a dynamic programming problem. Let's think about the subproblems...",
      "Great question about data structures! The choice depends on your use case.",
      "This is a classic problem that can be solved efficiently with the right algorithm.",
      "I see what you're trying to do. Here's a more optimal approach..."
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add more specific responses based on keywords
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('array') || lowerMessage.includes('arrays')) {
      return "Arrays are fundamental data structures! They provide O(1) access time but O(n) insertion/deletion. Consider using dynamic arrays like vectors in C++ or lists in Python for flexibility.";
    } else if (lowerMessage.includes('binary tree') || lowerMessage.includes('tree')) {
      return "Binary trees are hierarchical structures where each node has at most two children. Common traversal methods include inorder, preorder, and postorder. Tree problems often use recursion!";
    } else if (lowerMessage.includes('sorting') || lowerMessage.includes('sort')) {
      return "There are many sorting algorithms! Quick sort and merge sort are O(n log n) on average. For small arrays, insertion sort can be faster. Counting sort works well for integers in a small range.";
    } else if (lowerMessage.includes('big o') || lowerMessage.includes('complexity')) {
      return "Time complexity describes how algorithm runtime grows with input size. Common complexities: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n²) quadratic.";
    } else if (lowerMessage.includes('recursion')) {
      return "Recursion breaks problems into smaller subproblems. Always define your base case and ensure you're moving toward it. Stack overflow can occur with deep recursion - consider iteration or memoization.";
    } else if (lowerMessage.includes('graph')) {
      return "Graphs can be represented as adjacency lists or matrices. Common algorithms include DFS, BFS, Dijkstra's for shortest paths, and Kruskal's/Prim's for minimum spanning trees.";
    } else if (lowerMessage.includes('dynamic programming') || lowerMessage.includes('dp')) {
      return "Dynamic programming optimizes recursive solutions by storing results. Identify overlapping subproblems and optimal substructure. Bottom-up (tabulation) vs top-down (memoization) approaches.";
    }
    
    return randomResponse;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const botResponse = await generateBotResponse(userMessage.content);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      console.error('Chatbot error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: "Chat cleared! How can I help you with your coding questions?",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      <div ref={constraintsRef} className="chatbot-constraints" />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            drag
            dragMomentum={false}
            dragConstraints={constraintsRef}
            onDrag={(e, info) => setDragPosition({ x: info.point.x, y: info.point.y })}
            style={{ x: dragPosition.x, y: dragPosition.y }}
          >
            <div className="chatbot-header">
              <div className="chatbot-info">
                <Bot size={20} />
                <div>
                  <h3>AI Coding Assistant</h3>
                  <span className="chatbot-status">Online</span>
                </div>
              </div>
              
              <div className="chatbot-controls">
                <button
                  className="chatbot-control-btn"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  className="chatbot-control-btn close"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <div className="chatbot-content">
                <div className="chatbot-messages">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className={`message ${message.type}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="message-avatar">
                        {message.type === 'bot' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div className="message-content">
                        <p>{message.content}</p>
                        <span className="message-time">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      className="message bot loading"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="message-avatar">
                        <Bot size={16} />
                      </div>
                      <div className="message-content">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                <div className="chatbot-input">
                  <div className="input-container">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about algorithms, data structures, coding problems..."
                      className="message-input"
                      rows="1"
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="send-button"
                      title="Send message"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  
                  <div className="input-actions">
                    <button
                      onClick={clearChat}
                      className="clear-chat-btn"
                      title="Clear chat"
                    >
                      Clear Chat
                    </button>
                    <span className="input-hint">Press Enter to send</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        className={`chatbot-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && <div className="fab-pulse"></div>}
      </motion.button>
    </>
  );
};

export default Chatbot;
