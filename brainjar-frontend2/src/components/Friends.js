import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Search, UserPlus, UserX, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import friendService from '../services/friendService';
import './Friends.css';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [sendingRequests, setSendingRequests] = useState(new Set());

  useEffect(() => {
    loadFriendsData();
  }, []);

  useEffect(() => {
    if (searchTerm.length > 0) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadFriendsData = async () => {
    setLoading(true);
    try {
      const [friendsData, suggestionsData, requestsData] = await Promise.all([
        friendService.getFriends(),
        friendService.getUserSuggestions(),
        friendService.getPendingRequests()
      ]);

      setFriends(Array.isArray(friendsData) ? friendsData : friendsData.friends || []);
      setFriendSuggestions(Array.isArray(suggestionsData) ? suggestionsData : suggestionsData.users || []);
      setPendingRequests(Array.isArray(requestsData) ? requestsData : requestsData.requests || []);
    } catch (error) {
      console.error('Failed to load friends data:', error);
      toast.error('Failed to load friends data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/friends/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSendFriendRequest = async (userId, username) => {
    if (sendingRequests.has(userId)) return;

    setSendingRequests(prev => new Set([...prev, userId]));
    
    try {
      await friendService.sendFriendRequest(userId);
      toast.success(`Friend request sent to ${username}! 🎉`);
      
      // Remove from suggestions and search results
      setFriendSuggestions(prev => prev.filter(user => user.id !== userId));
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      
      if (error.response?.status === 409) {
        toast.error('Friend request already sent or you are already friends');
      } else if (error.response?.status === 404) {
        toast.error('User not found');
      } else {
        toast.error('Failed to send friend request');
      }
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRemoveFriend = async (friendId, username) => {
    if (window.confirm(`Are you sure you want to remove ${username} from your friends?`)) {
      try {
        const response = await fetch(`http://localhost:8080/api/friends/remove/${friendId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          toast.success(`${username} removed from friends`);
          setFriends(prev => prev.filter(friend => friend.id !== friendId));
        } else {
          throw new Error('Failed to remove friend');
        }
      } catch (error) {
        console.error('Error removing friend:', error);
        toast.error('Failed to remove friend');
      }
    }
  };

  const handleStartChat = (userId, username) => {
    // This would open the chat interface with the selected user
    toast.info(`Chat with ${username} will open soon! 💬`);
  };

  const renderUserCard = (user, actions) => (
    <motion.div
      key={user.id}
      className="user-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <div className="user-info">
        <div className="user-avatar">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={`${user.username}'s avatar`} />
          ) : (
            <div className="avatar-initial">
              {user.username[0].toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="user-details">
          <h4 className="username">{user.username}</h4>
          {user.bio && <p className="user-bio">{user.bio}</p>}
          
          <div className="user-stats">
            <div className="stat-item">
              <span className="stat-value">{user.total_problems_solved || 0}</span>
              <span className="stat-label">Problems Solved</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{user.current_streak || 0}</span>
              <span className="stat-label">Day Streak</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="user-actions">
        {actions}
      </div>
    </motion.div>
  );

  const tabContent = {
    friends: (
      <div className="friends-list">
        {friends.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No friends yet</h3>
            <p>Start by adding some friends from the suggestions below!</p>
          </div>
        ) : (
          friends.map(friend => renderUserCard(friend, (
            <div className="friend-actions">
              <button
                className="action-btn message-btn"
                onClick={() => handleStartChat(friend.id, friend.username)}
                title="Send message"
              >
                <MessageCircle size={16} />
              </button>
              <button
                className="action-btn remove-btn"
                onClick={() => handleRemoveFriend(friend.id, friend.username)}
                title="Remove friend"
              >
                <UserX size={16} />
              </button>
            </div>
          )))
        )}
      </div>
    ),

    suggestions: (
      <div className="suggestions-list">
        {friendSuggestions.length === 0 ? (
          <div className="empty-state">
            <Heart size={48} />
            <h3>No suggestions available</h3>
            <p>Check back later for new friend suggestions!</p>
          </div>
        ) : (
          friendSuggestions.map(user => renderUserCard(user, (
            <div className="suggestion-actions">
              <button
                className={`action-btn add-friend-btn ${sendingRequests.has(user.id) ? 'sending' : ''}`}
                onClick={() => handleSendFriendRequest(user.id, user.username)}
                disabled={sendingRequests.has(user.id)}
                title="Send friend request"
              >
                {sendingRequests.has(user.id) ? (
                  <div className="mini-spinner"></div>
                ) : (
                  <UserPlus size={16} />
                )}
              </button>
              <button
                className="action-btn message-btn"
                onClick={() => handleStartChat(user.id, user.username)}
                title="Send message"
              >
                <MessageCircle size={16} />
              </button>
            </div>
          )))
        )}
      </div>
    ),

    search: (
      <div className="search-section">
        <div className="search-input-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search for users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="search-results">
          {searchResults.length === 0 && searchTerm ? (
            <div className="empty-state">
              <Search size={48} />
              <h3>No users found</h3>
              <p>Try searching with different keywords</p>
            </div>
          ) : (
            searchResults.map(user => renderUserCard(user, (
              <div className="search-actions">
                <button
                  className={`action-btn add-friend-btn ${sendingRequests.has(user.id) ? 'sending' : ''}`}
                  onClick={() => handleSendFriendRequest(user.id, user.username)}
                  disabled={sendingRequests.has(user.id)}
                  title="Send friend request"
                >
                  {sendingRequests.has(user.id) ? (
                    <div className="mini-spinner"></div>
                  ) : (
                    <UserPlus size={16} />
                  )}
                </button>
                <button
                  className="action-btn message-btn"
                  onClick={() => handleStartChat(user.id, user.username)}
                  title="Send message"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            )))
          )}
        </div>
      </div>
    )
  };

  if (loading) {
    return (
      <div className="friends-loading">
        <div className="loading-spinner"></div>
        <p>Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h1>
          <Users size={24} />
          Friends
        </h1>
        <p>Connect with fellow coders and build your network!</p>
      </div>

      <div className="friends-tabs">
        {[
          { key: 'friends', label: 'My Friends', count: friends.length },
          { key: 'suggestions', label: 'Suggestions', count: friendSuggestions.length },
          { key: 'search', label: 'Search', count: null }
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count !== null && <span className="count-badge">{tab.count}</span>}
          </button>
        ))}
      </div>

      <div className="friends-content">
        {tabContent[activeTab]}
      </div>
    </div>
  );
};

export default Friends;
