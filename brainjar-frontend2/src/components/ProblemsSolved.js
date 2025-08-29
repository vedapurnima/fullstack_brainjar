import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheckCircle, 
  FiCode, 
  FiCalendar, 
  FiTag,
  FiTrendingUp,
  FiRefreshCw,
  FiAward,
  FiClock
} from 'react-icons/fi';
import './ProblemsSolved.css';

const ProblemsSolved = ({ isOpen, onClose }) => {
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });

  useEffect(() => {
    if (isOpen) {
      fetchSolvedProblems();
    }
  }, [isOpen]);

  const fetchSolvedProblems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:8080/problems/solved', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch solved problems: ${response.status}`);
      }

      const data = await response.json();
      setSolvedProblems(data);
      
      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const thisWeek = data.filter(problem => 
        new Date(problem.created_at) > weekAgo
      ).length;
      
      const thisMonth = data.filter(problem => 
        new Date(problem.created_at) > monthAgo
      ).length;
      
      setStats({
        total: data.length,
        thisWeek,
        thisMonth
      });
    } catch (error) {
      console.error('Error fetching solved problems:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#64ffda';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'algorithms': return FiTrendingUp;
      case 'data structures': return FiCode;
      case 'dynamic programming': return FiCheckCircle;
      default: return FiCode;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="problems-solved-overlay">
      <motion.div
        className="problems-solved-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="modal-header">
          <h2>
            <FiCheckCircle />
            Problems Solved
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <FiAward />
            <div>
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Solved</span>
            </div>
          </div>
          <div className="stat-card">
            <FiCalendar />
            <div>
              <span className="stat-number">{stats.thisWeek}</span>
              <span className="stat-label">This Week</span>
            </div>
          </div>
          <div className="stat-card">
            <FiClock />
            <div>
              <span className="stat-number">{stats.thisMonth}</span>
              <span className="stat-label">This Month</span>
            </div>
          </div>
        </div>

        <div className="modal-content">
          {isLoading ? (
            <div className="loading-state">
              <FiRefreshCw className="spinning" size={32} />
              <p>Loading your achievements...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>Error: {error}</p>
              <button onClick={fetchSolvedProblems} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : solvedProblems.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FiCode size={64} />
              <h3>No Problems Solved Yet</h3>
              <p>Start solving problems to build your achievement collection!</p>
              <button className="explore-btn" onClick={onClose}>
                Browse Problems
              </button>
            </motion.div>
          ) : (
            <div className="problems-grid">
              <AnimatePresence>
                {solvedProblems.map((problem, index) => {
                  const CategoryIcon = getCategoryIcon(problem.category);
                  return (
                    <motion.div
                      key={problem.id}
                      className="problem-card"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -40 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="problem-header">
                        <div className="problem-icon">
                          <CategoryIcon size={24} />
                        </div>
                        <div 
                          className="difficulty-badge"
                          style={{ 
                            backgroundColor: getDifficultyColor(problem.difficulty_level) 
                          }}
                        >
                          {problem.difficulty_level || 'Medium'}
                        </div>
                      </div>

                      <h3 className="problem-title">{problem.title}</h3>
                      <p className="problem-description">
                        {problem.description.length > 120 
                          ? `${problem.description.substring(0, 120)}...` 
                          : problem.description
                        }
                      </p>

                      <div className="problem-meta">
                        <div className="category-tag">
                          <FiTag size={14} />
                          {problem.category}
                        </div>
                        <div className="solved-date">
                          <FiCalendar size={14} />
                          {new Date(problem.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {problem.tags && problem.tags.length > 0 && (
                        <div className="tags-section">
                          {problem.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                          {problem.tags.length > 3 && (
                            <span className="tag-more">+{problem.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProblemsSolved;
