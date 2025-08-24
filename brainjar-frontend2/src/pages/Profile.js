import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUser as User,
  HiOutlineEnvelope as Mail,
  HiOutlineCalendar as Calendar,
  HiTrophy as Trophy,
  HiFire as Fire,
  HiCodeBracket as Code,
  HiStar as Star,
  HiBookOpen as BookOpen,
  HiUsers as Users,
  HiPencil as Edit,
  HiCheck as Check,
  HiXMark as X,
  HiCheckBadge as Badge,
  HiOutlineChartBar as Chart,
  HiOutlineClock as Clock
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [userStats, setUserStats] = useState({
    problemsSolved: 0,
    problemsCreated: 0,
    currentStreak: 0,
    totalPoints: 0,
    friendsCount: 0,
    averageRating: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats and activity in parallel
      const [statsRes, activityRes] = await Promise.allSettled([
        api.get('/user/stats'),
        api.get('/user/activity')
      ]);

      // Handle stats data
      if (statsRes.status === 'fulfilled') {
        setUserStats(statsRes.value.data);
      } else {
        // Mock data if API fails
        setUserStats({
          problemsSolved: Math.floor(Math.random() * 50) + 10,
          problemsCreated: Math.floor(Math.random() * 20) + 5,
          currentStreak: Math.floor(Math.random() * 15) + 1,
          totalPoints: Math.floor(Math.random() * 500) + 100,
          friendsCount: Math.floor(Math.random() * 25) + 5,
          averageRating: (Math.random() * 2 + 3).toFixed(1)
        });
      }

      // Handle activity data
      if (activityRes.status === 'fulfilled') {
        setRecentActivity(activityRes.value.data);
      } else {
        // Mock recent activity
        setRecentActivity([
          {
            id: 1,
            type: 'problem_solved',
            title: 'Two Sum',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            points: 10
          },
          {
            id: 2,
            type: 'problem_created',
            title: 'Binary Search Tree Validation',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            points: 25
          },
          {
            id: 3,
            type: 'friend_added',
            title: 'Connected with Alice',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            points: 5
          }
        ]);
      }

      // Set achievements based on stats
      const achievementsList = [
        {
          id: 1,
          name: 'First Steps',
          description: 'Solved your first problem',
          icon: '🚀',
          unlocked: userStats.problemsSolved >= 1,
          progress: Math.min(userStats.problemsSolved, 1),
          target: 1
        },
        {
          id: 2,
          name: 'Problem Solver',
          description: 'Solved 10 problems',
          icon: '🎯',
          unlocked: userStats.problemsSolved >= 10,
          progress: Math.min(userStats.problemsSolved, 10),
          target: 10
        },
        {
          id: 3,
          name: 'Creator',
          description: 'Created 5 problems',
          icon: '🎨',
          unlocked: userStats.problemsCreated >= 5,
          progress: Math.min(userStats.problemsCreated, 5),
          target: 5
        },
        {
          id: 4,
          name: 'Streak Master',
          description: 'Maintain a 7-day streak',
          icon: '🔥',
          unlocked: userStats.currentStreak >= 7,
          progress: Math.min(userStats.currentStreak, 7),
          target: 7
        },
        {
          id: 5,
          name: 'Social Butterfly',
          description: 'Connect with 10 friends',
          icon: '👥',
          unlocked: userStats.friendsCount >= 10,
          progress: Math.min(userStats.friendsCount, 10),
          target: 10
        }
      ];
      setAchievements(achievementsList);

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      const response = await api.put('/user/profile', editForm);
      updateUser(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      // For demo purposes, just close editing mode
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditForm({
      username: user?.username || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Less than an hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'problem_solved':
        return <Trophy className="activity-type-icon success" />;
      case 'problem_created':
        return <Code className="activity-type-icon primary" />;
      case 'friend_added':
        return <Users className="activity-type-icon secondary" />;
      default:
        return <Star className="activity-type-icon" />;
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner large"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="profile-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Profile Header */}
      <motion.div 
        className="profile-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <div className="profile-info">
              {isEditing ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="edit-input"
                    placeholder="Username"
                  />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="edit-input"
                    placeholder="Email"
                  />
                  <div className="edit-actions">
                    <button onClick={handleEditSubmit} className="edit-save-btn">
                      <Check size={16} />
                      Save
                    </button>
                    <button onClick={handleEditCancel} className="edit-cancel-btn">
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="profile-name">{user?.username || 'User'}</h1>
                  <div className="profile-details">
                    <span className="profile-email">
                      <Mail size={16} />
                      {user?.email || 'user@example.com'}
                    </span>
                    <span className="profile-joined">
                      <Calendar size={16} />
                      Joined {formatDate(user?.created_at || new Date())}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="edit-profile-btn">
              <Edit size={18} />
              Edit Profile
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="profile-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">
              <Trophy size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{userStats.problemsSolved}</span>
              <span className="stat-label">Problems Solved</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon secondary">
              <Code size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{userStats.problemsCreated}</span>
              <span className="stat-label">Problems Created</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon accent">
              <Fire size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{userStats.currentStreak}</span>
              <span className="stat-label">Day Streak</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <Star size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{userStats.totalPoints}</span>
              <span className="stat-label">Total Points</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{userStats.friendsCount}</span>
              <span className="stat-label">Friends</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon info">
              <Chart size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{userStats.averageRating}</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="profile-main">
        {/* Achievements Section */}
        <motion.div 
          className="profile-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="section-header">
            <h2>
              <Badge size={24} />
              Achievements
            </h2>
            <span className="achievements-count">
              {achievements.filter(a => a.unlocked).length} / {achievements.length}
            </span>
          </div>
          
          <div className="achievements-grid">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="achievement-icon">
                  {achievement.icon}
                </div>
                <div className="achievement-info">
                  <h4 className="achievement-name">{achievement.name}</h4>
                  <p className="achievement-description">{achievement.description}</p>
                  {!achievement.unlocked && (
                    <div className="achievement-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {achievement.progress} / {achievement.target}
                      </span>
                    </div>
                  )}
                </div>
                {achievement.unlocked && (
                  <div className="achievement-check">
                    <Check size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          className="profile-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="section-header">
            <h2>
              <Clock size={24} />
              Recent Activity
            </h2>
          </div>
          
          <div className="activity-timeline">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                className="activity-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="activity-icon-wrapper">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content">
                  <h4 className="activity-title">{activity.title}</h4>
                  <span className="activity-time">{getTimeAgo(activity.timestamp)}</span>
                  {activity.points && (
                    <span className="activity-points">+{activity.points} points</span>
                  )}
                </div>
              </motion.div>
            ))}
            
            {recentActivity.length === 0 && (
              <div className="empty-activity">
                <BookOpen size={48} />
                <p>No recent activity</p>
                <span>Start solving problems to see your activity here!</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;
