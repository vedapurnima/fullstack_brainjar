import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star, MessageSquare, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import problemService from '../services/problemService';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import './FeedbackForm.css';

const FeedbackForm = ({ problem, onClose, onFeedbackSubmitted }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (rating === 0) {
      newErrors.rating = 'Please provide a rating';
    }

    if (comment.trim() && comment.trim().length < 10) {
      newErrors.comment = 'If provided, comment should be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const feedbackData = {
        problem_id: problem.id,
        rating: rating,
        comment: comment.trim() || null
      };

      const newFeedback = await problemService.submitFeedback(feedbackData);
      
      // Add user info to the feedback for immediate display
      const feedbackWithUser = {
        ...newFeedback,
        username: user?.name || user?.email || 'You',
        submitted_at: new Date().toISOString()
      };

      onFeedbackSubmitted(feedbackWithUser);
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please log in to submit feedback');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit feedback. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    if (errors.rating && newRating > 0) {
      setErrors(prev => ({ ...prev, rating: undefined }));
    }
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
    if (errors.comment && e.target.value.trim().length >= 10) {
      setErrors(prev => ({ ...prev, comment: undefined }));
    }
  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Poor - Needs significant improvement',
      2: 'Fair - Some issues to address',
      3: 'Good - Decent problem overall',
      4: 'Very Good - Well-crafted problem',
      5: 'Excellent - Outstanding problem!'
    };
    return texts[rating] || 'Select a rating';
  };

  return (
    <motion.div 
      className="feedback-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="feedback-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="header-info">
            <h2>
              <Star size={24} />
              Rate & Review
            </h2>
            <p className="problem-reference">"{problem.title}"</p>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label className="form-label">
              Rating *
              <span className="help-text">How would you rate this problem?</span>
            </label>
            <div className="rating-section">
              <StarRating 
                rating={rating} 
                onRatingChange={handleRatingChange}
                size={32}
                interactive={true}
              />
              <span className={`rating-text ${rating > 0 ? 'selected' : ''}`}>
                {getRatingText(rating)}
              </span>
            </div>
            {errors.rating && (
              <span className="error-message">
                <AlertCircle size={16} />
                {errors.rating}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="comment" className="form-label">
              Comment (Optional)
              <span className="help-text">Share your thoughts about this problem</span>
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={handleCommentChange}
              className={`form-textarea ${errors.comment ? 'error' : ''}`}
              placeholder="What did you think about this problem? Was it clear, challenging, well-explained? Any suggestions for improvement?"
              rows="4"
            />
            {errors.comment && (
              <span className="error-message">
                <AlertCircle size={16} />
                {errors.comment}
              </span>
            )}
          </div>

          <div className="feedback-guidelines">
            <h4>📝 Feedback Guidelines:</h4>
            <ul>
              <li>Be constructive and specific in your feedback</li>
              <li>Consider problem clarity, difficulty, and usefulness</li>
              <li>Suggest improvements if you see any issues</li>
              <li>Be respectful to the problem author</li>
            </ul>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackForm;
