import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiCalendar, 
  FiTarget,
  FiRefreshCw,
  FiAward,
  FiZap,
  FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import streakService from '../services/streakService';
import './StreakTracker.css';

const StreakTracker = ({ isOpen, onClose }) => {
  const [streak, setStreak] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchStreak();
    }
  }, [isOpen]);

  const fetchStreak = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await streakService.getCurrentStreak();
      setStreak(data);
    } catch (error) {
      console.error('Error fetching streak:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load streak data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStreakLevel = (count) => {
    if (count >= 100) return { level: 'Legendary', color: '#FFD700', icon: FiAward };
    if (count >= 50) return { level: 'Master', color: '#9C27B0', icon: FiStar };
    if (count >= 30) return { level: 'Expert', color: '#FF5722', icon: FiZap };
    if (count >= 14) return { level: 'Pro', color: '#FF9800', icon: FiZap };
    if (count >= 7) return { level: 'Rising', color: '#4CAF50', icon: FiTrendingUp };
    return { level: 'Beginner', color: '#64ffda', icon: FiTarget };
  };

  const getStreakMessage = (count) => {
    if (count === 0) return "Start your coding journey today!";
    if (count === 1) return "Great start! Keep the momentum going!";
    if (count < 7) return "You're building a habit! Keep it up!";
    if (count < 14) return "Impressive consistency! You're on fire!";
    if (count < 30) return "Amazing dedication! You're a pro!";
    if (count < 50) return "Incredible streak! You're an expert!";
    if (count < 100) return "Legendary status incoming!";
    return "You're a coding legend! Incredible dedication!";
  };

  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const streakStart = streak ? new Date(streak.last_active) : today;
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const isActive = streak && date <= new Date(streak.last_active) && 
                      date >= new Date(new Date(streak.last_active).getTime() - (streak.count - 1) * 24 * 60 * 60 * 1000);
      
      days.push({
        date: date.getDate(),
        isActive,
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    return days;
  };

  if (!isOpen) return null;

  const streakLevel = streak ? getStreakLevel(streak.count) : getStreakLevel(0);
  const StreakIcon = streakLevel.icon;
  const calendarDays = generateCalendarDays();

  return (
    <div className="streak-tracker-overlay">
      <motion.div
        className="streak-tracker-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="modal-header">
          <h2>
            <FiTrendingUp />
            Streak Tracker
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {isLoading ? (
            <div className="loading-state">
              <FiRefreshCw className="spinning" size={32} />
              <p>Loading your streak...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>Error: {error}</p>
              <button onClick={fetchStreak} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="streak-display">
                <motion.div 
                  className="streak-circle"
                  style={{ borderColor: streakLevel.color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <StreakIcon size={40} style={{ color: streakLevel.color }} />
                  <span className="streak-count">{streak?.count || 0}</span>
                  <span className="streak-label">Day Streak</span>
                </motion.div>
                
                <div className="streak-info">
                  <h3 className="streak-level" style={{ color: streakLevel.color }}>
                    {streakLevel.level}
                  </h3>
                  <p className="streak-message">
                    {getStreakMessage(streak?.count || 0)}
                  </p>
                  
                  {streak?.last_active && (
                    <div className="last-active">
                      <FiCalendar size={16} />
                      Last active: {new Date(streak.last_active).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="calendar-section">
                <h4>Last 30 Days</h4>
                <div className="calendar-grid">
                  {calendarDays.map((day, index) => (
                    <motion.div
                      key={index}
                      className={`calendar-day ${day.isActive ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      {day.date}
                    </motion.div>
                  ))}
                </div>
                
                <div className="calendar-legend">
                  <div className="legend-item">
                    <div className="legend-box active"></div>
                    <span>Problem solved</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box"></div>
                    <span>No activity</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box today"></div>
                    <span>Today</span>
                  </div>
                </div>
              </div>

              <div className="motivational-section">
                <h4>Keep Going!</h4>
                <div className="milestones">
                  <div className={`milestone ${(streak?.count || 0) >= 7 ? 'achieved' : ''}`}>
                    <FiTarget />
                    <span>7 days - Week Warrior</span>
                  </div>
                  <div className={`milestone ${(streak?.count || 0) >= 30 ? 'achieved' : ''}`}>
                    <FiZap />
                    <span>30 days - Month Master</span>
                  </div>
                  <div className={`milestone ${(streak?.count || 0) >= 100 ? 'achieved' : ''}`}>
                    <FiAward />
                    <span>100 days - Century Champion</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StreakTracker;
