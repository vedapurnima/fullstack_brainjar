import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiTrendingUp, FiCalendar, FiAward } from 'react-icons/fi';
import { api } from '../services/api';
import './StreakDashboard.css';

const StreakDashboard = () => {
  const [streakStats, setStreakStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStreakStats();
  }, []);

  const fetchStreakStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/streaks/stats');
      setStreakStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching streak stats:', err);
      setError('Failed to load streak data');
    } finally {
      setLoading(false);
    }
  };

  const getStreakColor = (days) => {
    if (days >= 30) return '#10B981'; // Emerald
    if (days >= 14) return '#8B5CF6'; // Purple  
    if (days >= 7) return '#3B82F6';  // Blue
    if (days >= 3) return '#F59E0B';  // Amber
    return '#6B7280'; // Gray
  };

  const getStreakMessage = (days) => {
    if (days === 0) return "Time to start your coding journey! 🚀";
    if (days === 1) return "Great start! Keep the momentum going! 💪";
    if (days < 7) return "You're building a habit! Don't break the chain! ⚡";
    if (days < 14) return "Impressive dedication! You're on fire! 🔥";
    if (days < 30) return "Coding machine! Your consistency is inspiring! 🌟";
    return "Legendary streak! You're a coding master! 👑";
  };

  const WeeklyActivityGrid = ({ weeklyActivity }) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    return (
      <div className="weekly-activity">
        <h4>This Week's Activity</h4>
        <div className="activity-grid">
          {weeklyActivity.map((active, index) => (
            <motion.div
              key={index}
              className={`activity-day ${active ? 'active' : ''}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="day-label">{days[index]}</span>
              <div className={`day-indicator ${active ? 'solved' : 'missed'}`} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="streak-dashboard loading">
        <div className="streak-skeleton">
          <div className="skeleton-main-card" />
          <div className="skeleton-stats">
            <div className="skeleton-stat" />
            <div className="skeleton-stat" />
            <div className="skeleton-stat" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="streak-dashboard error">
        <div className="error-message">
          <FiTarget size={48} />
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={fetchStreakStats} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="streak-dashboard">
      <motion.div 
        className="main-streak-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="streak-header">
          <FiTarget 
            size={32} 
            style={{ color: getStreakColor(streakStats.current_streak) }}
          />
          <h2>Current Streak</h2>
        </div>
        
        <motion.div 
          className="streak-counter"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <span 
            className="streak-number"
            style={{ color: getStreakColor(streakStats.current_streak) }}
          >
            {streakStats.current_streak}
          </span>
          <span className="streak-unit">days</span>
        </motion.div>

        <motion.p 
          className="streak-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {getStreakMessage(streakStats.current_streak)}
        </motion.p>

        <div className="streak-progress">
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(streakStats.streak_percentage, 100)}%` }}
              transition={{ delay: 0.6, duration: 1 }}
              style={{ backgroundColor: getStreakColor(streakStats.current_streak) }}
            />
          </div>
          <span className="progress-text">
            {streakStats.streak_percentage.toFixed(0)}% active this month
          </span>
        </div>
      </motion.div>

      <div className="streak-stats-grid">
        <motion.div 
          className="stat-card"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <FiAward className="stat-icon longest" />
          <div className="stat-content">
            <h3>{streakStats.longest_streak}</h3>
            <p>Longest Streak</p>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <FiCalendar className="stat-icon today" />
          <div className="stat-content">
            <h3>{streakStats.problems_solved_today}</h3>
            <p>Problems Today</p>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <FiTrendingUp className="stat-icon percentage" />
          <div className="stat-content">
            <h3>{streakStats.streak_percentage.toFixed(0)}%</h3>
            <p>Monthly Active</p>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="weekly-activity-container"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <WeeklyActivityGrid weeklyActivity={streakStats.weekly_activity} />
      </motion.div>
    </div>
  );
};

export default StreakDashboard;
