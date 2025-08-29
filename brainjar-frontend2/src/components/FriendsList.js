import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, 
  FiUserMinus, 
  FiMessageCircle, 
  FiCalendar, 
  FiStar,
  FiTrendingUp,
  FiHeart,
  FiRefreshCw
} from 'react-icons/fi';
import './FriendsList.css';

const FriendsList = ({ isOpen, onClose }) => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:8080/friends', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch friends: ${response.status}`);
      }

      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfriend = async (friendId) => {
    // TODO: Implement unfriend functionality
    console.log('Unfriend:', friendId);
  };

  const handleMessage = async (friendId) => {
    // TODO: Implement messaging functionality
    console.log('Message:', friendId);
  };

  if (!isOpen) return null;

  return (
    <div className="friends-list-overlay">
      <motion.div
        className="friends-list-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="modal-header">
          <h2>
            <FiUsers />
            My Friends
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {isLoading ? (
            <div className="loading-state">
              <FiRefreshCw className="spinning" size={32} />
              <p>Loading your friends...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>Error: {error}</p>
              <button onClick={fetchFriends} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : friends.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FiHeart size={64} />
              <h3>No Friends Yet</h3>
              <p>Start connecting with other problem solvers!</p>
              <button className="explore-btn" onClick={onClose}>
                Find Friends
              </button>
            </motion.div>
          ) : (
            <div className="friends-grid">
              <AnimatePresence>
                {friends.map((friend, index) => (
                  <motion.div
                    key={friend.id}
                    className="friend-card"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="friend-header">
                      <div className="friend-avatar">
                        <FiUsers size={32} />
                      </div>
                      <div className="friend-info">
                        <h3>Friend #{friend.user_id || friend.friend_id}</h3>
                        <p className="friendship-date">
                          <FiCalendar size={14} />
                          Friends since {new Date(friend.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="friend-actions">
                      <button 
                        className="message-btn"
                        onClick={() => handleMessage(friend.user_id || friend.friend_id)}
                      >
                        <FiMessageCircle size={16} />
                        Message
                      </button>
                      <button 
                        className="unfriend-btn"
                        onClick={() => handleUnfriend(friend.user_id || friend.friend_id)}
                      >
                        <FiUserMinus size={16} />
                        Unfriend
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FriendsList;
