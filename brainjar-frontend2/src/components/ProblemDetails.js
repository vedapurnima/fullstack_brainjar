import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Tag, 
  Edit, 
  Trash2, 
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Star,
  MessageSquare,
  Code,
  User,
  ThumbsUp,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import problemService from '../services/problemService';
import ProblemForm from './ProblemForm';
import SolveProblemForm from './SolveProblemForm';
import FeedbackForm from './FeedbackForm';
import StarRating from './StarRating';
import './ProblemDetails.css';

const ProblemDetails = ({ problem, onClose, onProblemUpdated, onProblemDeleted }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [showSolveForm, setShowSolveForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [loadingSolutions, setLoadingSolutions] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (problem) {
      fetchFeedback();
      fetchSolutions();
    }
  }, [problem]);

  const fetchFeedback = async () => {
    try {
      setLoadingFeedback(true);
      const feedbackData = await problemService.getProblemFeedback(problem.id);
      setFeedback(feedbackData);
      
      // Calculate average rating
      if (feedbackData.length > 0) {
        const totalRating = feedbackData.reduce((sum, item) => sum + (item.rating || 0), 0);
        setAverageRating(totalRating / feedbackData.length);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      // Don't show error toast for missing feedback - it's expected for new problems
    } finally {
      setLoadingFeedback(false);
    }
  };

  const fetchSolutions = async () => {
    try {
      setLoadingSolutions(true);
      const solutionsData = await problemService.getProblemSolutions(problem.id);
      setSolutions(solutionsData);
    } catch (error) {
      console.error('Error fetching solutions:', error);
      // Don't show error toast for missing solutions - it's expected for new problems
    } finally {
      setLoadingSolutions(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopyToClipboard = async () => {
    try {
      const text = `Problem: ${problem.title}\n\nCategory: ${problem.category}\n\nDescription:\n${problem.description}`;
      await navigator.clipboard.writeText(text);
      toast.success('Problem details copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleSolveProblem = () => {
    setShowSolveForm(true);
  };

  const handleGiveFeedback = () => {
    setShowFeedbackForm(true);
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleProblemUpdated = (updatedProblem) => {
    onProblemUpdated(updatedProblem);
    setShowEditForm(false);
    toast.success('Problem updated successfully!');
  };

  const handleSolutionSubmitted = (newSolution) => {
    setSolutions(prev => [newSolution, ...prev]);
    setShowSolveForm(false);
    toast.success('Solution submitted successfully!');
  };

  const handleFeedbackSubmitted = (newFeedback) => {
    setFeedback(prev => [newFeedback, ...prev]);
    setShowFeedbackForm(false);
    
    // Recalculate average rating
    const updatedFeedback = [newFeedback, ...feedback];
    const totalRating = updatedFeedback.reduce((sum, item) => sum + (item.rating || 0), 0);
    setAverageRating(totalRating / updatedFeedback.length);
    
    toast.success('Feedback submitted successfully!');
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await problemService.deleteProblem(problem.id);
      onProblemDeleted(problem.id);
      toast.success('Problem deleted successfully!');
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast.error('Failed to delete problem');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: problem.title,
        text: `Check out this coding problem: ${problem.title}`,
        url: window.location.href
      });
    } else {
      handleCopyToClipboard();
    }
  };

  const isOwner = user?.id === problem.user_id;
  const hasUserSolved = solutions.some(sol => sol.user_id === user?.id);
  const hasUserRated = feedback.some(fb => fb.user_id === user?.id);

  return (
    <>
      <motion.div 
        className="problem-details-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="problem-details-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="modal-header">
            <div className="header-info">
              <h1 className="problem-title">{problem.title}</h1>
              <div className="problem-meta">
                <span className="problem-category">
                  <Tag size={16} />
                  {problem.category}
                </span>
                <span className="problem-date">
                  <Calendar size={16} />
                  Created {formatDate(problem.created_at)}
                </span>
                {problem.created_by && (
                  <span 
                    className="problem-author clickable"
                    onClick={() => handleViewProfile(problem.user_id)}
                  >
                    <User size={16} />
                    By {problem.created_by}
                  </span>
                )}
              </div>
              
              {/* Rating Display */}
              {feedback.length > 0 && (
                <div className="rating-display">
                  <StarRating rating={averageRating} readOnly size={18} />
                  <span className="rating-text">
                    {averageRating.toFixed(1)} ({feedback.length} {feedback.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>
            <button onClick={onClose} className="close-btn">
              <X size={20} />
            </button>
          </div>

          {/* Problem Content */}
          <div className="problem-content">
            <div className="content-section">
              <h3>Problem Description</h3>
              <div className="problem-description">
                {problem.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Solutions Section */}
            <div className="content-section">
              <h3>
                Solutions ({solutions.length})
                {hasUserSolved && <span className="solved-badge">✓ You've solved this</span>}
              </h3>
              
              {loadingSolutions ? (
                <div className="loading-section">Loading solutions...</div>
              ) : solutions.length > 0 ? (
                <div className="solutions-list">
                  {solutions.slice(0, 3).map((solution, index) => (
                    <div key={index} className="solution-item">
                      <div className="solution-header">
                        <span className="solution-author">
                          <User size={14} />
                          {solution.username || 'Anonymous'}
                        </span>
                        <span className="solution-date">
                          {formatDate(solution.submitted_at)}
                        </span>
                      </div>
                      <div className="solution-preview">
                        {solution.solution.substring(0, 100)}
                        {solution.solution.length > 100 && '...'}
                      </div>
                    </div>
                  ))}
                  {solutions.length > 3 && (
                    <div className="more-solutions">
                      +{solutions.length - 3} more solutions
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">No solutions yet. Be the first to solve this problem!</div>
              )}
            </div>

            {/* Feedback Section */}
            <div className="content-section">
              <h3>
                Feedback & Reviews ({feedback.length})
              </h3>
              
              {loadingFeedback ? (
                <div className="loading-section">Loading feedback...</div>
              ) : feedback.length > 0 ? (
                <div className="feedback-list">
                  {feedback.slice(0, 5).map((item, index) => (
                    <div key={index} className="feedback-item">
                      <div className="feedback-header">
                        <div className="feedback-user">
                          <User size={14} />
                          {item.username || 'Anonymous'}
                        </div>
                        <div className="feedback-rating">
                          <StarRating rating={item.rating} readOnly size={14} />
                        </div>
                        <span className="feedback-date">
                          {formatDate(item.submitted_at)}
                        </span>
                      </div>
                      {item.comment && (
                        <div className="feedback-comment">
                          {item.comment}
                        </div>
                      )}
                    </div>
                  ))}
                  {feedback.length > 5 && (
                    <div className="more-feedback">
                      +{feedback.length - 5} more reviews
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">No feedback yet. Be the first to review this problem!</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <div className="action-group">
              <button onClick={handleCopyToClipboard} className="action-btn secondary">
                <Copy size={18} />
                Copy Details
              </button>
              <button onClick={handleShare} className="action-btn secondary">
                <ExternalLink size={18} />
                Share
              </button>
            </div>
            
            <div className="action-group">
              {!hasUserSolved && (
                <button onClick={handleSolveProblem} className="action-btn primary">
                  <Code size={18} />
                  Solve Problem
                </button>
              )}
              
              {!hasUserRated && !isOwner && (
                <button onClick={handleGiveFeedback} className="action-btn primary">
                  <Star size={18} />
                  Rate & Review
                </button>
              )}
              
              {isOwner && (
                <>
                  <button onClick={handleEdit} className="action-btn primary">
                    <Edit size={18} />
                    Edit Problem
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="action-btn danger"
                    disabled={deleteLoading}
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Delete Confirmation */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div 
                className="delete-confirm-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div 
                  className="delete-confirm-modal"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <div className="delete-confirm-header">
                    <AlertCircle size={24} className="warning-icon" />
                    <h3>Delete Problem</h3>
                  </div>
                  <p>
                    Are you sure you want to delete "<strong>{problem.title}</strong>"? 
                    This action cannot be undone and will also delete all solutions and feedback.
                  </p>
                  <div className="delete-confirm-actions">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)} 
                      className="cancel-btn"
                      disabled={deleteLoading}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDelete} 
                      className="delete-btn"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete Problem'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Edit Form */}
      {showEditForm && (
        <ProblemForm
          problem={problem}
          onClose={() => setShowEditForm(false)}
          onProblemCreated={handleProblemUpdated}
        />
      )}

      {/* Solve Form */}
      {showSolveForm && (
        <SolveProblemForm
          problem={problem}
          onClose={() => setShowSolveForm(false)}
          onSolutionSubmitted={handleSolutionSubmitted}
        />
      )}

      {/* Feedback Form */}
      {showFeedbackForm && (
        <FeedbackForm
          problem={problem}
          onClose={() => setShowFeedbackForm(false)}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </>
  );
};

export default ProblemDetails;
