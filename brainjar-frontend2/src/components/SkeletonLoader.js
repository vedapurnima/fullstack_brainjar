import React from 'react';
import { motion } from 'framer-motion';
import './SkeletonLoader.css';

const SkeletonLoader = () => {
  return (
    <div className="dashboard-skeleton">
      {/* Header Skeleton */}
      <div className="skeleton-header">
        <div className="skeleton skeleton-text" style={{ width: '300px', height: '2rem' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '400px', height: '1.5rem', marginTop: '0.5rem' }}></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="skeleton-stats">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="skeleton-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="skeleton skeleton-avatar"></div>
            <div className="skeleton-stat-content">
              <div className="skeleton skeleton-text" style={{ width: '60px', height: '2rem' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '120px', height: '1rem', marginTop: '0.5rem' }}></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="skeleton-main">
        <div className="skeleton-left">
          {/* Badges Section */}
          <div className="skeleton-section">
            <div className="skeleton skeleton-text" style={{ width: '150px', height: '1.5rem', marginBottom: '1rem' }}></div>
            <div className="skeleton-badges-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-badge">
                  <div className="skeleton skeleton-avatar"></div>
                  <div className="skeleton skeleton-text" style={{ width: '80px', height: '1rem', marginTop: '0.5rem' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="skeleton-section">
            <div className="skeleton skeleton-text" style={{ width: '120px', height: '1.5rem', marginBottom: '1rem' }}></div>
            <div className="skeleton-actions">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton skeleton-card" style={{ height: '3rem' }}></div>
              ))}
            </div>
          </div>
        </div>

        <div className="skeleton-right">
          {/* Leaderboard Skeleton */}
          <div className="skeleton-section">
            <div className="skeleton skeleton-text" style={{ width: '130px', height: '1.5rem', marginBottom: '1rem' }}></div>
            <div className="skeleton-leaderboard">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-leaderboard-item">
                  <div className="skeleton skeleton-avatar"></div>
                  <div className="skeleton-leaderboard-content">
                    <div className="skeleton skeleton-text" style={{ width: '100px', height: '1rem' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '80px', height: '0.8rem', marginTop: '0.25rem' }}></div>
                  </div>
                  <div className="skeleton skeleton-text" style={{ width: '50px', height: '1rem' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters Skeleton */}
          <div className="skeleton-section">
            <div className="skeleton skeleton-text" style={{ width: '100px', height: '1.5rem', marginBottom: '1rem' }}></div>
            <div className="skeleton skeleton-card" style={{ height: '8rem' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
