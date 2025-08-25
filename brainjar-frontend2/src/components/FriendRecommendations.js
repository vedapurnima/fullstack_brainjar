import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, 
  FiUserPlus, 
  FiRefreshCw, 
  FiMessageCircle, 
  FiStar,
  FiTrendingUp,
  FiCode,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { RiRobot2Line, RiWizardLine, RiNinjaMaskLine, RiAncientGateLine, RiSpaceShipLine, RiFlowerLine } from 'react-icons/ri';
import './FriendRecommendations.css';

const FriendRecommendations = ({ onClose }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sendingRequests, setSendingRequests] = useState(new Set());
  const [sentRequests, setSentRequests] = useState(new Set());

  // Avatar mapping for character display
  const avatarIcons = {
    'cyber-warrior': RiRobot2Line,
    'code-wizard': RiWizardLine,
    'debug-ninja': RiNinjaMaskLine,
    'data-sage': RiAncientGateLine,
    'logic-explorer': RiSpaceShipLine,
    'pattern-botanist': RiFlowerLine
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/friends/suggestions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError('Failed to load friend recommendations. Please try again.');
      console.error('Friend recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId) => {
    if (sendingRequests.has(friendId) || sentRequests.has(friendId)) {
      return;
    }

    setSendingRequests(prev => new Set([...prev, friendId]));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friend_id: friendId })
      });

      if (!response.ok) {
        throw new Error('Failed to send friend request');
      }

      setSentRequests(prev => new Set([...prev, friendId]));
      
      // Remove from recommendations
      setRecommendations(prev => prev.filter(rec => rec.user.id !== friendId));
      
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError('Failed to send friend request. Please try again.');
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const getReasonIcon = (reason) => {
    switch (reason) {
      case 'Similar problem solving patterns':
        return FiCode;
      case 'Active streak maintainer':
        return FiTrendingUp;
      case 'Shared personality traits':
        return FiUsers;
      case 'High problem solver':
        return FiStar;
      default:
        return FiUsers;
    }
  };

  const getAvatarIcon = (avatarId) => {
    return avatarIcons[avatarId] || RiRobot2Line;
  };

  if (loading) {
    return (
      <div className="friend-recommendations">
        <div className="recommendations-container">
          <motion.div 
            className="loading-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <FiRefreshCw size={48} className="spinning" />
            <h3>Finding Your Perfect Coding Companions</h3>
            <p>Analyzing shared interests and problem-solving patterns...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error && !recommendations.length) {
    return (
      <div className="friend-recommendations">
        <div className="recommendations-container">
          <div className="error-card">
            <FiX size={48} />
            <h3>Unable to Load Recommendations</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchRecommendations}>
              <FiRefreshCw />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="friend-recommendations">
      <div className="recommendations-container">
        <motion.div 
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-content">
            <FiUsers size={32} />
            <div>
              <h2>Friend Recommendations</h2>
              <p>Connect with coders who share your interests and coding style</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </motion.div>

        {error && (
          <motion.div 
            className="error-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <div className="recommendations-actions">
          <button className="refresh-btn" onClick={fetchRecommendations}>
            <FiRefreshCw size={16} />
            Refresh Recommendations
          </button>
        </div>

        {recommendations.length === 0 ? (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiUsers size={64} />
            <h3>No New Recommendations</h3>
            <p>Keep solving problems and building your profile to get personalized friend recommendations!</p>
            <button className="explore-btn" onClick={onClose}>
              <FiCode />
              Start Solving Problems
            </button>
          </motion.div>
        ) : (
          <div className="recommendations-grid">
            <AnimatePresence>
              {recommendations.map((recommendation, index) => {
                // recommendation object is flat with properties like user_id, username, name, etc.
                const AvatarIcon = getAvatarIcon(recommendation.avatar || 'Default');
                const ReasonIcon = getReasonIcon('High Compatibility');
                const isRequestSent = sentRequests.has(recommendation.user_id);
                const isSending = sendingRequests.has(recommendation.user_id);

                return (
                  <motion.div
                    key={recommendation.user_id}
                    className="recommendation-card"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ delay: index * 0.1 }}
                    layout
                  >
                    <div className="card-header">
                      <div className="user-avatar">
                        <AvatarIcon size={48} />
                        <div className="avatar-ring"></div>
                      </div>
                      <div className="recommendation-reason">
                        <ReasonIcon size={16} />
                        <span>High Compatibility</span>
                      </div>
                    </div>

                    <div className="user-info">
                      <h3>{recommendation.name || recommendation.username}</h3>
                      <p className="user-handle">@{recommendation.username}</p>
                      {recommendation.bio && (
                        <p className="user-bio">{recommendation.bio}</p>
                      )}
                    </div>

                    <div className="user-stats">
                      <div className="stat">
                        <FiStar size={16} />
                        <span>{recommendation.problems_solved || 0} solved</span>
                      </div>
                      <div className="stat">
                        <FiTrendingUp size={16} />
                        <span>{recommendation.current_streak || 0} day streak</span>
                      </div>
                    </div>

                    {recommendation.personality_traits && recommendation.personality_traits.length > 0 && (
                      <div className="personality-traits">
                        <h4>Personality</h4>
                        <div className="traits-list">
                          {recommendation.personality_traits.slice(0, 3).map(trait => (
                            <span key={trait} className="trait-tag">{trait}</span>
                          ))}
                          {recommendation.personality_traits.length > 3 && (
                            <span className="trait-more">+{recommendation.personality_traits.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="card-actions">
                      {isRequestSent ? (
                        <motion.button
                          className="request-sent-btn"
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          disabled
                        >
                          <FiCheck size={16} />
                          Request Sent
                        </motion.button>
                      ) : (
                        <button
                          className="add-friend-btn"
                          onClick={() => sendFriendRequest(recommendation.user_id)}
                          disabled={isSending}
                        >
                          {isSending ? (
                            <>
                              <FiRefreshCw size={16} className="spinning" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <FiUserPlus size={16} />
                              Add Friend
                            </>
                          )}
                        </button>
                      )}
                      <button className="message-btn">
                        <FiMessageCircle size={16} />
                        Message
                      </button>
                    </div>

                    <div className="compatibility-score">
                      <div className="score-bar">
                        <div 
                          className="score-fill" 
                          style={{ width: `${recommendation.compatibility_score}%` }}
                        ></div>
                      </div>
                      <span>{recommendation.compatibility_score}% match</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRecommendations;
