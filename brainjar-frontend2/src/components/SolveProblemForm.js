import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Code, Send, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import problemService from '../services/problemService';
import { useAuth } from '../context/AuthContext';
import './SolveProblemForm.css';

const SolveProblemForm = ({ problem, onClose, onSolutionSubmitted }) => {
  const { user } = useAuth();
  const [solution, setSolution] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!solution.trim()) {
      newErrors.solution = 'Solution code is required';
    } else if (solution.trim().length < 10) {
      newErrors.solution = 'Solution should be at least 10 characters';
    }

    if (explanation.trim() && explanation.trim().length < 20) {
      newErrors.explanation = 'If provided, explanation should be at least 20 characters';
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
      
      const solutionData = {
        problem_id: problem.id,
        solution: solution.trim(),
        explanation: explanation.trim() || null,
        language: 'javascript' // Default for now, could be extended
      };

      const newSolution = await problemService.submitSolution(solutionData);
      
      // Add user info to the solution for immediate display
      const solutionWithUser = {
        ...newSolution,
        username: user?.name || user?.email || 'You',
        submitted_at: new Date().toISOString()
      };

      onSolutionSubmitted(solutionWithUser);
      toast.success('Solution submitted successfully!');
    } catch (error) {
      console.error('Error submitting solution:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please log in to submit a solution');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit solution. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSolutionChange = (e) => {
    setSolution(e.target.value);
    if (errors.solution && e.target.value.trim().length >= 10) {
      setErrors(prev => ({ ...prev, solution: undefined }));
    }
  };

  const handleExplanationChange = (e) => {
    setExplanation(e.target.value);
    if (errors.explanation && e.target.value.trim().length >= 20) {
      setErrors(prev => ({ ...prev, explanation: undefined }));
    }
  };

  return (
    <motion.div 
      className="solve-problem-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="solve-problem-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="header-info">
            <h2>
              <Code size={24} />
              Solve Problem
            </h2>
            <p className="problem-reference">"{problem.title}"</p>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="solve-form">
          <div className="form-group">
            <label htmlFor="solution" className="form-label">
              Solution Code *
              <span className="help-text">Write your solution to this problem</span>
            </label>
            <textarea
              id="solution"
              value={solution}
              onChange={handleSolutionChange}
              className={`form-textarea code-input ${errors.solution ? 'error' : ''}`}
              placeholder="// Write your solution here
function solveProblem() {
  // Your implementation
  return result;
}"
              rows="12"
              required
            />
            {errors.solution && (
              <span className="error-message">
                <AlertCircle size={16} />
                {errors.solution}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="explanation" className="form-label">
              Explanation (Optional)
              <span className="help-text">Explain your approach and reasoning</span>
            </label>
            <textarea
              id="explanation"
              value={explanation}
              onChange={handleExplanationChange}
              className={`form-textarea ${errors.explanation ? 'error' : ''}`}
              placeholder="Explain your solution approach, time complexity, space complexity, or any insights..."
              rows="4"
            />
            {errors.explanation && (
              <span className="error-message">
                <AlertCircle size={16} />
                {errors.explanation}
              </span>
            )}
          </div>

          <div className="solution-tips">
            <h4>💡 Tips for a good solution:</h4>
            <ul>
              <li>Write clean, readable code with proper indentation</li>
              <li>Add comments to explain complex logic</li>
              <li>Consider edge cases and error handling</li>
              <li>Explain your approach in the explanation field</li>
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
                  Submit Solution
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SolveProblemForm;
