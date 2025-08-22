import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';
import './Leaderboard.css';

const Leaderboard = ({ data, currentUser }) => {
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown size={20} className="rank-icon gold" />;
      case 2: return <Medal size={20} className="rank-icon silver" />;
      case 3: return <Medal size={20} className="rank-icon bronze" />;
      default: return <span className="rank-number">#{rank}</span>;
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1: return 'leaderboard-item gold';
      case 2: return 'leaderboard-item silver';
      case 3: return 'leaderboard-item bronze';
      default: return 'leaderboard-item';
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="leaderboard-empty">
        <Trophy size={48} />
        <p>No leaderboard data available</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="leaderboard-title">
          <Trophy size={20} />
          <span>Top Performers</span>
        </div>
      </div>
      
      <div className="leaderboard-list">
        {data.slice(0, 10).map((user, index) => (
          <motion.div
            key={user.id || index}
            className={getRankClass(index + 1)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 8 }}
          >
            <div className="rank-section">
              {getRankIcon(index + 1)}
            </div>
            
            <div className="user-info">
              <span className={`username ${user.username === currentUser ? 'current-user' : ''}`}>
                {user.username || `User ${index + 1}`}
                {user.username === currentUser && <span className="you-badge">You</span>}
              </span>
              <div className="user-stats">
                <span className="problems-solved">
                  {user.problems_solved || Math.floor(Math.random() * 100 + 10)} problems
                </span>
                <span className="streak">
                  🔥 {user.streak || Math.floor(Math.random() * 30 + 1)} streak
                </span>
              </div>
            </div>
            
            <div className="points">
              <span className="points-value">
                {((user.problems_solved || 50) * 10 + (user.streak || 5) * 5).toLocaleString()}
              </span>
              <span className="points-label">pts</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {data.length === 0 && (
        <motion.div 
          className="leaderboard-placeholder"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>Start solving problems to appear on the leaderboard!</p>
        </motion.div>
      )}
    </div>
  );
};

export default Leaderboard;
