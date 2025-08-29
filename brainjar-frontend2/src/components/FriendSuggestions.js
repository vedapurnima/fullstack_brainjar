import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, MessageCircle, Trophy, Flame, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import friendService from '../services/friendService';
import './FriendSuggestions_Modern.css';

const FriendSuggestions = ({ onMessageClick }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequests, setSendingRequests] = useState(new Set());

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Use the new user suggestions endpoint
      const data = await friendService.getUserSuggestions();
      
      // Handle both old format (array) and new format (object with users array)
      const users = Array.isArray(data) ? data : (data.users || []);
      setSuggestions(users);
      
      if (users.length === 0) {
        console.log('No friend suggestions available');
      }
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
      toast.error('Failed to load friend suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleAddFriend = async (friendId, username) => {
    if (sendingRequests.has(friendId)) return;

    // Validate friendId
    if (!friendId) {
      toast.error('Invalid user ID');
      return;
    }

    setSendingRequests(prev => new Set([...prev, friendId]));
    
    try {
      await friendService.sendFriendRequest(friendId);
      toast.success(`Friend request sent to ${username}! 🎉`);
      
      // Remove the user from suggestions since request was sent
      setSuggestions(prev => prev.filter(suggestion => 
        (suggestion.id || suggestion.user?.id) !== friendId
      ));
    } catch (error) {
      console.error('Error sending friend request:', error);
      
      // More specific error handling
      if (error.response?.status === 409) {
        toast.error('Friend request already sent or you are already friends');
      } else if (error.response?.status === 404) {
        toast.error('User not found');
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || error.response?.data?.error || 'Bad request';
        toast.error(`Error: ${message}`);
      } else if (error.response?.status === 401) {
        toast.error('Please log in to send friend requests');
      } else {
        const message = error.response?.data?.message || error.message || 'Unknown error';
        toast.error(`Failed to send friend request: ${message}`);
      }
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const handleMessage = (userId, username) => {
    // Validate userId
    if (!userId) {
      toast.error('Invalid user ID');
      return;
    }

    if (onMessageClick) {
      onMessageClick(userId, username);
    } else {
      toast.info(`Chat feature will open for ${username} 💬`);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="friend-suggestions-loading">
        <div className="loading-spinner"></div>
        <p>Finding awesome coding companions...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="friend-suggestions-empty">
        <Users size={48} />
        <h3>No friend suggestions available</h3>
        <p>Check back later for new coding companions!</p>
        <button onClick={fetchSuggestions} className="refresh-btn">
          Refresh Suggestions
        </button>
      </div>
    );
  }

  return (
    <div className="friend-suggestions">
      <div className="suggestions-header">
        <h3>
          <Users size={20} />
          Find Coding Friends
        </h3>
        <button onClick={fetchSuggestions} className="refresh-btn-small">
          Refresh
        </button>
      </div>

      <div className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.id || suggestion.user?.id}
            className="suggestion-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="suggestion-info">
              <div className="suggestion-avatar">
                {suggestion.character?.avatar ? (
                  <img 
                    src={suggestion.character.avatar} 
                    alt={`${suggestion.username || suggestion.user?.username}'s avatar`}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-initial">
                    {(suggestion.username || suggestion.user?.username || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="suggestion-details">
                <h4 className="suggestion-username">
                  {suggestion.username || suggestion.user?.username || 'Unknown User'}
                </h4>
                
                <div className="suggestion-stats">
                  <div className="stat-item">
                    <Trophy size={14} />
                    <span>{suggestion.problems_solved || suggestion.user?.problems_solved || 0} solved</span>
                  </div>
                  <div className="stat-item">
                    <Flame size={14} />
                    <span>{suggestion.current_streak || suggestion.user?.current_streak || 0} day streak</span>
                  </div>
                </div>

                {suggestion.reason && (
                  <p className="compatibility-reason">{suggestion.reason}</p>
                )}

                {suggestion.compatibility_score && (
                  <div className="compatibility-score">
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${suggestion.compatibility_score}%` }}
                      ></div>
                    </div>
                    <span className="score-text">{suggestion.compatibility_score}% match</span>
                  </div>
                )}

                {suggestion.character?.bio && (
                  <p className="character-bio">{suggestion.character.bio}</p>
                )}

                <div className="member-since">
                  <Clock size={12} />
                  <span>Joined {formatDateTime(suggestion.created_at || suggestion.user?.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="suggestion-actions">
              <button
                className={`add-friend-btn ${sendingRequests.has(suggestion.id || suggestion.user?.id) ? 'sending' : ''}`}
                onClick={() => handleAddFriend(
                  suggestion.id || suggestion.user?.id, 
                  suggestion.username || suggestion.user?.username
                )}
                disabled={sendingRequests.has(suggestion.id || suggestion.user?.id)}
                title="Send friend request"
              >
                {sendingRequests.has(suggestion.id || suggestion.user?.id) ? (
                  <div className="mini-spinner"></div>
                ) : (
                  <UserPlus size={16} />
                )}
              </button>
              
              <button
                className="message-btn"
                onClick={() => handleMessage(
                  suggestion.id || suggestion.user?.id, 
                  suggestion.username || suggestion.user?.username
                )}
                title="Send message"
              >
                <MessageCircle size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="suggestions-footer">
        <button className="view-all-btn" onClick={fetchSuggestions}>
          Load More Suggestions
        </button>
      </div>
    </div>
  );
};

export default FriendSuggestions;
