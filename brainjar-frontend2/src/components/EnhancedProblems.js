import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  Search, 
  Filter, 
  Star, 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown,
  Eye,
  Clock,
  User,
  Tags,
  Plus,
  BookOpen,
  TrendingUp,
  Award,
  Youtube
} from 'lucide-react';
import toast from 'react-hot-toast';
import './EnhancedProblems.css';

const EnhancedProblems = () => {
  const [problems, setProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories', icon: Code },
    { value: 'algorithms', label: 'Algorithms', icon: TrendingUp },
    { value: 'data-structures', label: 'Data Structures', icon: BookOpen },
    { value: 'web-dev', label: 'Web Development', icon: Code },
    { value: 'databases', label: 'Databases', icon: BookOpen },
    { value: 'system-design', label: 'System Design', icon: Award }
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'easy', label: 'Easy', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'hard', label: 'Hard', color: '#ef4444' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Most Recent' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'feedback_count', label: 'Most Discussed' }
  ];

  useEffect(() => {
    loadProblems();
  }, [selectedCategory, selectedDifficulty, sortBy]);

  const loadProblems = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call when backend is ready
      const mockProblems = [
        {
          id: '1',
          title: 'Two Sum Problem',
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          category: 'algorithms',
          difficulty: 'easy',
          created_by: 'alice_coder',
          created_by_avatar: null,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          rating: 4.5,
          views: 156,
          feedback_count: 12,
          tags: ['array', 'hash-table', 'easy'],
          youtube_resources: [
            {
              title: 'Two Sum - LeetCode Solution',
              url: 'https://www.youtube.com/watch?v=KLlXCFG5TnA',
              thumbnail: 'https://img.youtube.com/vi/KLlXCFG5TnA/mqdefault.jpg'
            }
          ]
        },
        {
          id: '2',
          title: 'Binary Search Tree Implementation',
          description: 'Implement a binary search tree with insert, delete, and search operations. Include traversal methods.',
          category: 'data-structures',
          difficulty: 'medium',
          created_by: 'bob_developer',
          created_by_avatar: null,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          rating: 4.8,
          views: 203,
          feedback_count: 18,
          tags: ['trees', 'recursion', 'medium'],
          youtube_resources: [
            {
              title: 'Binary Search Trees Explained',
              url: 'https://www.youtube.com/watch?v=gcULXE7ViZw',
              thumbnail: 'https://img.youtube.com/vi/gcULXE7ViZw/mqdefault.jpg'
            }
          ]
        },
        {
          id: '3',
          title: 'Design a Chat System',
          description: 'Design a scalable chat system like WhatsApp. Consider real-time messaging, user presence, message delivery.',
          category: 'system-design',
          difficulty: 'hard',
          created_by: 'charlie_architect',
          created_by_avatar: null,
          created_at: new Date(Date.now() - 10800000).toISOString(),
          rating: 4.2,
          views: 89,
          feedback_count: 7,
          tags: ['system-design', 'scalability', 'websockets'],
          youtube_resources: []
        }
      ];
      
      setProblems(mockProblems);
    } catch (error) {
      console.error('Failed to load problems:', error);
      toast.error('Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (problemId, rating) => {
    try {
      // Mock rating submission - replace with actual API call
      toast.success(`Rating submitted: ${rating} stars`);
      
      // Update local state
      setProblems(prev => 
        prev.map(problem => 
          problem.id === problemId 
            ? { ...problem, rating: ((problem.rating * 10 + rating) / 11).toFixed(1) }
            : problem
        )
      );
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  const handleFeedbackSubmit = async (problemId, feedback, isHelpful) => {
    try {
      // Mock feedback submission - replace with actual API call
      toast.success('Feedback submitted successfully!');
      
      // Update local state
      setProblems(prev => 
        prev.map(problem => 
          problem.id === problemId 
            ? { ...problem, feedback_count: problem.feedback_count + 1 }
            : problem
        )
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || problem.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || problem.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="enhanced-problems-loading">
        <div className="loading-spinner"></div>
        <p>Loading problems...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-problems-page">
      <div className="enhanced-problems-header">
        <h1>
          <Code size={28} />
          Coding Problems
        </h1>
        <p>Discover, solve, and share coding challenges with the community!</p>
      </div>

      <div className="enhanced-problems-controls">
        <div className="search-filter-section">
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search problems, tags, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-container">
            <div className="filter-group">
              <Filter size={16} />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="filter-select"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button 
          className="create-problem-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={18} />
          Create Problem
        </button>
      </div>

      <div className="problems-grid">
        <AnimatePresence>
          {filteredProblems.map((problem, index) => (
            <motion.div
              key={problem.id}
              className="problem-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="problem-header">
                <div className="problem-meta">
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                  >
                    {problem.difficulty}
                  </span>
                  <span className="category-badge">{problem.category}</span>
                </div>
                
                <div className="problem-stats">
                  <div className="stat">
                    <Eye size={14} />
                    {problem.views}
                  </div>
                  <div className="stat">
                    <MessageCircle size={14} />
                    {problem.feedback_count}
                  </div>
                  <div className="stat rating">
                    <Star size={14} />
                    {problem.rating}
                  </div>
                </div>
              </div>

              <h3 className="problem-title">{problem.title}</h3>
              <p className="problem-description">{problem.description}</p>

              <div className="problem-tags">
                {problem.tags.map(tag => (
                  <span key={tag} className="tag">
                    <Tags size={12} />
                    {tag}
                  </span>
                ))}
              </div>

              {problem.youtube_resources && problem.youtube_resources.length > 0 && (
                <div className="youtube-resources">
                  <h4>
                    <Youtube size={16} />
                    Learning Resources
                  </h4>
                  {problem.youtube_resources.slice(0, 1).map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="youtube-link"
                    >
                      <img src={resource.thumbnail} alt={resource.title} />
                      <span>{resource.title}</span>
                    </a>
                  ))}
                </div>
              )}

              <div className="problem-footer">
                <div className="problem-author">
                  <div className="author-avatar">
                    {problem.created_by_avatar ? (
                      <img src={problem.created_by_avatar} alt={problem.created_by} />
                    ) : (
                      <div className="avatar-initial">
                        {problem.created_by[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="author-name">{problem.created_by}</span>
                    <span className="created-date">
                      <Clock size={12} />
                      {formatDate(problem.created_at)}
                    </span>
                  </div>
                </div>

                <div className="problem-actions">
                  <RatingComponent 
                    problemId={problem.id}
                    currentRating={problem.rating}
                    onRatingSubmit={handleRatingSubmit}
                  />
                  <FeedbackComponent 
                    problemId={problem.id}
                    onFeedbackSubmit={handleFeedbackSubmit}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProblems.length === 0 && (
        <div className="no-problems">
          <Code size={64} />
          <h3>No problems found</h3>
          <p>Try adjusting your search criteria or create a new problem!</p>
        </div>
      )}
    </div>
  );
};

const RatingComponent = ({ problemId, currentRating, onRatingSubmit }) => {
  const [userRating, setUserRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const handleStarClick = (rating) => {
    setUserRating(rating);
    onRatingSubmit(problemId, rating);
    setShowRating(false);
    toast.success(`Rated ${rating} stars!`);
  };

  return (
    <div className="rating-component">
      <button
        className="rating-trigger"
        onClick={() => setShowRating(!showRating)}
      >
        <Star size={16} />
        Rate
      </button>

      <AnimatePresence>
        {showRating && (
          <motion.div
            className="rating-overlay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`star-btn ${star <= userRating ? 'active' : ''}`}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setUserRating(star)}
                  onMouseLeave={() => setUserRating(0)}
                >
                  <Star size={20} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FeedbackComponent = ({ problemId, onFeedbackSubmit }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isHelpful, setIsHelpful] = useState(null);

  const handleSubmit = () => {
    if (feedback.trim() && isHelpful !== null) {
      onFeedbackSubmit(problemId, feedback, isHelpful);
      setFeedback('');
      setIsHelpful(null);
      setShowFeedback(false);
    } else {
      toast.error('Please provide feedback and indicate if it was helpful');
    }
  };

  return (
    <div className="feedback-component">
      <button
        className="feedback-trigger"
        onClick={() => setShowFeedback(!showFeedback)}
      >
        <MessageCircle size={16} />
        Feedback
      </button>

      <AnimatePresence>
        {showFeedback && (
          <motion.div
            className="feedback-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <textarea
              placeholder="Share your thoughts on this problem..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="feedback-input"
              rows="3"
            />
            
            <div className="helpful-buttons">
              <span>Was this problem helpful?</span>
              <div className="helpful-controls">
                <button
                  className={`helpful-btn ${isHelpful === true ? 'active' : ''}`}
                  onClick={() => setIsHelpful(true)}
                >
                  <ThumbsUp size={14} />
                  Yes
                </button>
                <button
                  className={`helpful-btn ${isHelpful === false ? 'active' : ''}`}
                  onClick={() => setIsHelpful(false)}
                >
                  <ThumbsDown size={14} />
                  No
                </button>
              </div>
            </div>

            <div className="feedback-actions">
              <button className="cancel-btn" onClick={() => setShowFeedback(false)}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleSubmit}>
                Submit Feedback
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedProblems;
