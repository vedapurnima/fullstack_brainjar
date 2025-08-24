import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus as Plus,
  HiOutlineSearch as Search,
  HiOutlineAdjustments as Filter,
  HiOutlineViewGrid as Grid,
  HiOutlineViewList as List,
  HiOutlineGlobe as Globe,
  HiOutlineUser as User,
  HiOutlineClock as Clock,
  HiOutlineStar as Star,
  HiOutlineCode as Code,
  HiOutlineBookOpen as BookOpen
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import problemService from '../services/problemService';
import ProblemForm from '../components/ProblemForm';
import ProblemDetails from '../components/ProblemDetails';
import './Problems.css';

const Problems = () => {
  const { user, isAuthenticated } = useAuth();
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

  // Fetch problems when component mounts or problemsView changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchProblems();
    }
  }, [problemsView, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter problems when search term or category changes
  useEffect(() => {
    filterProblems();
  }, [problems, searchTerm, selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProblems = async () => {
    if (!isAuthenticated || !user) {
      setError('Please log in to view problems');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (problemsView === 'all') {
        // Fetch all problems from the community
        data = await problemService.getAllProblems();
      } else {
        // Fetch only the current user's problems
        data = await problemService.getProblems();
      }
      
      setProblems(data);
      setFilteredProblems(data);
    } catch (error) {
      console.error('Error fetching problems:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please log in to view problems');
        navigate('/login');
        return;
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load problems';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterProblems = () => {
    if (!problems || problems.length === 0) {
      setFilteredProblems([]);
      return;
    }

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

  if (loading) {
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
        <h2>Unable to Load Problems</h2>
        <p>{error}</p>
        <button onClick={fetchProblems} className="retry-btn">
          Try Again
        </button>
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
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Problems Content */}
      <div className="problems-content">
        {filteredProblems.length > 0 ? (
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
                    {problem.created_by && problemsView === 'all' && problem.created_by !== user?.username && (
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
