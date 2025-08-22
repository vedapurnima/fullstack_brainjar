import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, MessageCircle } from 'lucide-react';
import './FriendSuggestions.css';

const FriendSuggestions = ({ friends = [] }) => {
  // Mock friend suggestions
  const mockSuggestions = [
    { id: 1, username: 'alice_coder', problems_solved: 45, common_interests: ['Arrays', 'DP'] },
    { id: 2, username: 'bob_algorithm', problems_solved: 78, common_interests: ['Trees', 'Graphs'] },
    { id: 3, username: 'charlie_dev', problems_solved: 32, common_interests: ['Strings', 'Sorting'] },
    { id: 4, username: 'diana_prog', problems_solved: 56, common_interests: ['Math', 'Greedy'] }
  ];

  const suggestions = friends.length > 0 ? friends.slice(0, 4) : mockSuggestions;

  const handleAddFriend = (friendId, username) => {
    // Mock add friend functionality
    console.log('Adding friend:', friendId, username);
    // In real app, make API call here
  };

  if (suggestions.length === 0) {
    return (
      <div className="friend-suggestions-empty">
        <Users size={48} />
        <p>No friend suggestions available</p>
      </div>
    );
  }

  return (
    <div className="friend-suggestions">
      <div className="suggestions-list">
        {suggestions.map((friend, index) => (
          <motion.div
            key={friend.id}
            className="suggestion-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <div className="suggestion-info">
              <div className="suggestion-avatar">
                {(friend.username || friend.name || '?')[0].toUpperCase()}
              </div>
              <div className="suggestion-details">
                <h4 className="suggestion-username">
                  {friend.username || friend.name || 'Unknown User'}
                </h4>
                <p className="suggestion-stats">
                  {friend.problems_solved || Math.floor(Math.random() * 100 + 10)} problems solved
                </p>
                {friend.common_interests && (
                  <div className="common-interests">
                    {friend.common_interests.slice(0, 2).map((interest, i) => (
                      <span key={i} className="interest-tag">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="suggestion-actions">
              <button
                className="add-friend-btn"
                onClick={() => handleAddFriend(friend.id, friend.username)}
                title="Add friend"
              >
                <UserPlus size={16} />
              </button>
              <button
                className="message-btn"
                title="Send message"
              >
                <MessageCircle size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="suggestions-footer">
        <button className="view-all-btn">
          View All Suggestions
        </button>
      </div>
    </div>
  );
};

export default FriendSuggestions;
