import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Calendar,
  Tag,
  Loader,
  AlertCircle,
  RefreshCw,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, addAuthEventListener, AUTH_EVENTS } from '../context/AuthContext';
import problemService from '../services/problemService';
import ProblemForm from './ProblemForm';
import ProblemDetails from './ProblemDetails';
import './ProblemsList.css';

const ProblemsList = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Get unique categories from problems
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(problems.map(problem => problem.category))];
    return uniqueCategories.filter(category => category);
  }, [problems]);

  // Filter problems based on search term and category
  useEffect(() => {
    let filtered = problems;

    if (searchTerm) {
      filtered = filtered.filter(problem =>
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(problem => problem.category === selectedCategory);
    }

    setFilteredProblems(filtered);
  }, [problems, searchTerm, selectedCategory]);

  // Fetch problems function with better error handling
  const fetchProblems = useCallback(async (showToast = false) => {
    // Don't fetch if not authenticated or still loading auth
    if (!isAuthenticated || !user?.id || authLoading) {
      if (isMountedRef.current) {
        setLoading(false);
        setProblems([]);
        setError(null);
      }
      return;
    }

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
        console.log('Fetching problems for user:', user.username);
      }
      
      const data = await problemService.getProblems();
      
      if (isMountedRef.current) {
        const problemsArray = Array.isArray(data) ? data : [];
        setProblems(problemsArray);
        setLastFetchTime(new Date());
        
        if (showToast) {
          toast.success(`Loaded ${problemsArray.length} problems`);
        }
        console.log(`Successfully loaded ${problemsArray.length} problems for user:`, user.username);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
      
      if (isMountedRef.current) {
        setProblems([]);
        
        // Handle different error types
        if (error.response?.status === 401) {
          setError('Authentication expired. Please login again.');
          toast.error('Session expired. Please login again.');
          // Don't auto-logout here, let the API interceptor handle it
        } else if (error.response?.status === 403) {
          setError('You do not have permission to view problems.');
          toast.error('Access denied.');
        } else if (error.response?.status >= 500) {
          setError('Server error. Please try again later.');
          toast.error('Server error occurred.');
        } else if (error.message === 'Authentication required') {
          setError('Please login to view problems.');
        } else {
          setError('Failed to load problems. Please check your connection.');
          toast.error('Failed to load problems.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, user, authLoading]);

  // Clear data when user changes or logs out
  const clearProblemsData = useCallback(() => {
    if (isMountedRef.current) {
      setProblems([]);
      setFilteredProblems([]);
      setError(null);
      setLastFetchTime(null);
      setSearchTerm('');
      setSelectedCategory('');
      console.log('Cleared problems data');
    }
  }, []);

  // Listen for authentication events
  useEffect(() => {
    const handleAuthEvent = (event) => {
      const { user: eventUser } = event.detail;
      console.log('Auth event received:', event.type, eventUser?.username);
      
      switch (event.type) {
        case AUTH_EVENTS.LOGIN:
        case AUTH_EVENTS.REGISTER:
          // Clear old data and fetch new data for the logged-in user
          clearProblemsData();
          // Small delay to ensure auth state is fully updated
          setTimeout(() => {
            fetchProblems(true);
          }, 200);
          break;
          
        case AUTH_EVENTS.LOGOUT:
          // Clear all data on logout
          clearProblemsData();
          break;
          
        default:
          break;
      }
    };

    // Add event listeners for all auth events
    const unsubscribeLogin = addAuthEventListener(AUTH_EVENTS.LOGIN, handleAuthEvent);
    const unsubscribeRegister = addAuthEventListener(AUTH_EVENTS.REGISTER, handleAuthEvent);
    const unsubscribeLogout = addAuthEventListener(AUTH_EVENTS.LOGOUT, handleAuthEvent);

    return () => {
      unsubscribeLogin();
      unsubscribeRegister();
      unsubscribeLogout();
    };
  }, [fetchProblems, clearProblemsData]);

  // Initial fetch when component mounts and user is available
  useEffect(() => {
    if (isAuthenticated && user?.id && !authLoading) {
      console.log('Component mounted, fetching problems for user:', user.username);
      fetchProblems();
    }
  }, [isAuthenticated, user, authLoading, fetchProblems]);

  const handleProblemCreated = (newProblem) => {
    if (isMountedRef.current) {
      setProblems(prev => [newProblem, ...prev]);
      setShowForm(false);
      toast.success('Problem created successfully!');
    }
  };

  const handleViewDetails = (problem) => {
    setSelectedProblem(problem);
    setShowDetails(true);
  };

  const handleRefresh = () => {
    // Reset the fetch tracking to force a fresh fetch
    lastFetchedUserRef.current = null;
    fetchProblems(true);
  };

  const handleProblemUpdated = (updatedProblem) => {
    if (isMountedRef.current) {
      setProblems(prev => 
        prev.map(p => p.id === updatedProblem.id ? updatedProblem : p)
      );
    }
  };

  const handleProblemDeleted = (deletedId) => {
    if (isMountedRef.current) {
      setProblems(prev => prev.filter(p => p.id !== deletedId));
      setShowDetails(false);
      setSelectedProblem(null);
      toast.success('Problem deleted successfully!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="problems-loading">
        <Loader className="spinner" size={40} />
        <p>Initializing...</p>
      </div>
    );
  }

  // Show login message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="problems-loading">
        <AlertCircle size={40} />
        <p>Please login to view problems.</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  if (loading) {
    return (
      <div className="problems-loading">
        <Loader className="spinner" size={40} />
        <p>Loading problems...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="problems-error">
        <AlertCircle size={48} />
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button onClick={fetchProblems} className="retry-btn">
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      className="problems-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="problems-header" variants={itemVariants}>
        <div className="header-content">
          <h1>Problem Tracker</h1>
          <p>
            Manage and track your coding problems
            {user && <span className="user-indicator"> • Logged in as <strong>{user.username}</strong></span>}
          </p>
          {lastFetchTime && (
            <small className="last-updated">
              Last updated: {lastFetchTime.toLocaleTimeString()}
            </small>
          )}
        </div>
        <div className="header-actions">
          <button onClick={handleRefresh} className="refresh-btn" title="Refresh" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          </button>
          <button onClick={() => setShowForm(true)} className="add-problem-btn">
            <Plus size={18} />
            Add Problem
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div className="problems-filters" variants={itemVariants}>
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search problems by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <Filter size={20} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="results-count">
          Showing {filteredProblems.length} of {problems.length} problems
        </div>
      </motion.div>

      {/* Problems Grid */}
      {filteredProblems.length === 0 ? (
        <motion.div className="no-problems" variants={itemVariants}>
          <div className="no-problems-content">
            <Tag size={48} />
            <h3>No problems found</h3>
            <p>
              {problems.length === 0 
                ? "Get started by creating your first problem!"
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {problems.length === 0 && (
              <button onClick={() => setShowForm(true)} className="create-first-btn">
                <Plus size={18} />
                Create Your First Problem
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div className="problems-grid" variants={containerVariants}>
          <AnimatePresence>
            {filteredProblems.map((problem) => (
              <motion.div
                key={problem.id}
                className="problem-card"
                variants={itemVariants}
                whileHover={{ y: -4 }}
                layout
              >
                <div className="problem-card-header">
                  <h3 className="problem-title">{problem.title}</h3>
                  <span className="problem-category">
                    <Tag size={14} />
                    {problem.category}
                  </span>
                </div>
                
                <p className="problem-description">
                  {problem.description.length > 120 
                    ? `${problem.description.substring(0, 120)}...`
                    : problem.description
                  }
                </p>
                
                <div className="problem-card-footer">
                  <div className="problem-meta">
                    <span className="problem-date">
                      <Calendar size={14} />
                      {formatDate(problem.created_at)}
                    </span>
                    {problem.user_id && user && problem.user_id !== user.id && (
                      <span className="problem-author">
                        <User size={14} />
                        By: {problem.created_by || 'Other User'}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleViewDetails(problem)}
                    className="view-details-btn"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Problem Form Modal */}
      {showForm && (
        <ProblemForm
          onClose={() => setShowForm(false)}
          onProblemCreated={handleProblemCreated}
        />
      )}

      {/* Problem Details Modal */}
      {showDetails && selectedProblem && (
        <ProblemDetails
          problem={selectedProblem}
          onClose={() => {
            setShowDetails(false);
            setSelectedProblem(null);
          }}
          onProblemUpdated={handleProblemUpdated}
          onProblemDeleted={handleProblemDeleted}
        />
      )}
    </motion.div>
  );
};

export default ProblemsList;
