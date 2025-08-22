import React from 'react';
import { motion } from 'framer-motion';
import './BadgeDisplay.css';

const BadgeDisplay = ({ badges, problemsSolved }) => {
  return (
    <div className="badge-display">
      <div className="badges-grid">
        {badges.map((badge, index) => {
          const isUnlocked = problemsSolved >= badge.threshold;
          
          return (
            <motion.div
              key={badge.id}
              className={`badge-item ${isUnlocked ? 'unlocked' : 'locked'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: isUnlocked ? 1.05 : 1.02,
                y: isUnlocked ? -4 : 0
              }}
              title={badge.description}
            >
              <div className="badge-icon">
                <span className="badge-emoji">{badge.icon}</span>
                {isUnlocked && <div className="badge-glow"></div>}
              </div>
              
              <div className="badge-info">
                <h4 className="badge-name">{badge.name}</h4>
                <p className="badge-threshold">
                  {isUnlocked ? 'Unlocked!' : `${badge.threshold} problems`}
                </p>
                <div className="badge-progress">
                  <div 
                    className="badge-progress-bar"
                    style={{
                      width: `${Math.min(100, (problemsSolved / badge.threshold) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
              
              {!isUnlocked && <div className="badge-overlay"></div>}
            </motion.div>
          );
        })}
      </div>
      
      <div className="badge-summary">
        <p className="badges-earned">
          <strong>{badges.filter(badge => problemsSolved >= badge.threshold).length}</strong>
          {' of '}
          <strong>{badges.length}</strong> badges earned
        </p>
      </div>
    </div>
  );
};

export default BadgeDisplay;
