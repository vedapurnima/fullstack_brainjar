import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Globe,
  User,
  Clock,
  Star,
  Code,
  BookOpen,
  TrendingUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import problemService from '../services/problemService';
import ProblemForm from '../components/ProblemForm';
import ProblemDetails from '../components/ProblemDetails';
import './Problems.css';

const Problems = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [problemsView, setProblemsView] = useState('my'); // 'my' or 'all'
  
  const categories = ['Arrays', 'Strings', 'Dynamic Programming', 'Trees', 'Graphs', 'Sorting', 'Other'];

  useEffect(() => {
    if (!authLoading) {
      fetchProblems();
    }
  }, [isAuthenticated, user?.id, authLoading, problemsView]);

  useEffect(() => {
    filterProblems();
  }, [problems, searchTerm, selectedCategory]);

  const fetchProblems = async () => {
    // Check authentication first
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      setError('Please login to view problems.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = problemsView === 'all' 
        ? await problemService.getAllProblems()
        : await problemService.getProblems();
      
      setProblems(data);
      setFilteredProblems(data);
    } catch (error) {
      console.error('Error fetching problems:', error);
      
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        toast.error('Session expired. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view problems.');
        toast.error('Access denied.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
        toast.error('Server error occurred.');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load problems';
        setError(errorMessage);
        toast.error(errorMessage);
      }
      
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProblems = () => {
    let filtered = [...problems];

    if (searchTerm) {
      filtered = filtered.filter(problem =>
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(problem => 
        problem.category === selectedCategory
      );
    }

    setFilteredProblems(filtered);
  };

  const handleProblemCreated = (newProblem) => {
    setProblems(prev => [newProblem, ...prev]);
    setShowForm(false);
    toast.success('Problem created successfully!');
  };

  const handleProblemUpdated = (updatedProblem) => {
    setProblems(prev => prev.map(p => 
      p.id === updatedProblem.id ? updatedProblem : p
    ));
    setSelectedProblem(null);
  };

  const handleProblemDeleted = (problemId) => {
    setProblems(prev => prev.filter(p => p.id !== problemId));
    setSelectedProblem(null);
  };

  const handleRefresh = () => {
    fetchProblems();
    toast.success('Problems refreshed!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatsText = () => {
    if (problemsView === 'all') {
      return `${filteredProblems.length} problems from the community`;
    }
    return `${filteredProblems.length} of your problems`;
  };

  if (authLoading || (loading && problems.length === 0)) {
    return (
      <div className="problems-loading">
        <div className="loading-spinner large"></div>
        <p>Loading problems...</p>
      </div>
    );
  }

  if (error && problems.length === 0) {
    return (
      <div className="problems-error">
        <div className="error-icon">
          <AlertCircle size={48} />
        </div>
        <h2>Unable to Load Problems</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={handleRefresh} className="retry-btn">
            <RefreshCw size={18} />
            Try Again
          </button>
          {error.includes('login') && (
            <button onClick={() => navigate('/login')} className="login-btn">
              Go to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="problems-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {/* Header */}
      <div className="problems-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">
              <BookOpen size={28} />
              {problemsView === 'all' ? 'All Problems' : 'My Problems'}
            </h1>
            <p className="page-description">
              {getStatsText()}
            </p>
          </div>
          
          <div className="header-actions">
            {/* View Toggle */}
            <div className="view-toggle">
              <button
                onClick={() => setProblemsView('my')}
                className={`toggle-btn ${problemsView === 'my' ? 'active' : ''}`}
              >
                <User size={16} />
                My Problems
              </button>
              <button
                onClick={() => setProblemsView('all')}
                className={`toggle-btn ${problemsView === 'all' ? 'active' : ''}`}
              >
                <Globe size={16} />
                All Problems
              </button>
            </div>
            
            {/* Refresh Button */}
            <button onClick={handleRefresh} className="refresh-btn" title="Refresh Problems">
              <RefreshCw size={18} />
            </button>
            
            {/* Add Problem Button */}
            <button onClick={() => setShowForm(true)} className="add-btn">
              <Plus size={18} />
              Add Problem
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="problems-filters">
        <div className="filter-row">
          <div className="search-filter">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-filter">
            <Filter size={18} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="view-controls">
            <button 
              onClick={() => setViewMode('grid')}
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Grid View"
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Problems Content */}
      <div className="problems-content">
        {loading ? (
          <div className="problems-loading">
            <div className="loading-spinner"></div>
            <p>Loading problems...</p>
          </div>
        ) : filteredProblems.length > 0 ? (
          <div className={`problems-container ${viewMode}`}>
            {filteredProblems.map((problem, index) => (
              <motion.div
                key={problem.id}
                className="problem-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedProblem(problem)}
              >
                <div className="problem-card-header">
                  <h3 className="problem-title">{problem.title}</h3>
                  <span className="problem-category">{problem.category}</span>
                </div>
                
                <p className="problem-description">
                  {problem.description.substring(0, 120)}...
                </p>
                
                <div className="problem-card-footer">
                  <div className="problem-meta">
                    <span className="meta-item">
                      <Clock size={14} />
                      {formatDate(problem.created_at)}
                    </span>
                    {problem.created_by && problemsView === 'all' && (
                      <span className="meta-item">
                        <User size={14} />
                        {problem.created_by}
                      </span>
                    )}
                  </div>
                  
                  {problem.average_rating > 0 && (
                    <div className="problem-rating">
                      <Star size={14} />
                      {problem.average_rating.toFixed(1)}
                      {problem.feedback_count && (
                        <span className="rating-count">({problem.feedback_count})</span>
                      )}
                    </div>
                  )}
                </div>
                
                {problem.solution_count > 0 && (
                  <div className="problem-stats">
                    <span className="stat-badge">
                      <Code size={12} />
                      {problem.solution_count} solutions
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              {problemsView === 'all' ? <Globe size={48} /> : <BookOpen size={48} />}
            </div>
            <h3>
              {searchTerm || selectedCategory 
                ? 'No problems match your filters' 
                : problemsView === 'all'
                  ? 'No problems available yet'
                  : 'You haven\'t created any problems yet'
              }
            </h3>
            <p>
              {searchTerm || selectedCategory
                ? 'Try adjusting your search or filter criteria'
                : problemsView === 'all'
                  ? 'Be the first to share a problem with the community!'
                  : 'Click "Add Problem" to create your first coding challenge'
              }
            </p>
            {(!searchTerm && !selectedCategory) && (
              <button onClick={() => setShowForm(true)} className="cta-btn">
                <Plus size={18} />
                Create Your First Problem
              </button>
            )}
          </div>
        )}
      </div>

      {/* Forms and Modals */}
      <AnimatePresence>
        {showForm && (
          <ProblemForm 
            onClose={() => setShowForm(false)}
            onProblemCreated={handleProblemCreated}
          />
        )}
        
        {selectedProblem && (
          <ProblemDetails
            problem={selectedProblem}
            onClose={() => setSelectedProblem(null)}
            onProblemUpdated={handleProblemUpdated}
            onProblemDeleted={handleProblemDeleted}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Problems;
