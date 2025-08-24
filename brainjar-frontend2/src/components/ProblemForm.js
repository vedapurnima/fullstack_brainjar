import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import problemService from '../services/problemService';
import './ProblemForm.css';

const ProblemForm = ({ onClose, onProblemCreated, problem = null }) => {
  const isEditing = !!problem;
  
  const [formData, setFormData] = useState({
    title: problem?.title || '',
    description: problem?.description || '',
    category: problem?.category || ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    } else if (formData.category.trim().length < 2) {
      newErrors.category = 'Category must be at least 2 characters long';
    } else if (formData.category.trim().length > 50) {
      newErrors.category = 'Category must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setLoading(true);
      
      const problemData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim()
      };

      let result;
      if (isEditing) {
        result = await problemService.updateProblem(problem.id, problemData);
        toast.success('Problem updated successfully!');
      } else {
        result = await problemService.createProblem(problemData);
        toast.success('Problem created successfully!');
      }

      onProblemCreated(result);
    } catch (error) {
      console.error('Error saving problem:', error);
      const errorMessage = error.response?.data?.message || 
        `Failed to ${isEditing ? 'update' : 'create'} problem`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const predefinedCategories = [
    'Data Structures',
    'Algorithms',
    'Dynamic Programming',
    'Graph Theory',
    'Tree Problems',
    'Array Problems',
    'String Manipulation',
    'Mathematics',
    'Greedy Algorithms',
    'Backtracking',
    'Binary Search',
    'Sorting',
    'Hash Tables',
    'Recursion',
    'Other'
  ];

  return (
    <motion.div 
      className="problem-form-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="problem-form-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-content">
            <h2>
              {isEditing ? 'Edit Problem' : 'Create New Problem'}
            </h2>
            <p>
              {isEditing 
                ? 'Update your problem details below'
                : 'Fill in the details to create a new coding problem'
              }
            </p>
          </div>
          <button onClick={onClose} className="close-btn" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="problem-form">
          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Problem Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter a descriptive title for your problem"
              disabled={loading}
              maxLength={100}
            />
            {errors.title && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.title}
              </div>
            )}
            <div className="char-count">
              {formData.title.length}/100
            </div>
          </div>

          {/* Category Field */}
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category *
            </label>
            <div className="category-input-container">
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`form-input ${errors.category ? 'error' : ''}`}
                placeholder="Enter or select a category"
                disabled={loading}
                maxLength={50}
                list="categories"
              />
              <datalist id="categories">
                {predefinedCategories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            {errors.category && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.category}
              </div>
            )}
            <div className="char-count">
              {formData.category.length}/50
            </div>
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Problem Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Describe the problem in detail. Include examples, constraints, and any special requirements..."
              disabled={loading}
              rows={8}
              maxLength={2000}
            />
            {errors.description && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.description}
              </div>
            )}
            <div className="char-count">
              {formData.description.length}/2000
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="spinner" size={18} />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? <CheckCircle size={18} /> : <Save size={18} />}
                  {isEditing ? 'Update Problem' : 'Create Problem'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProblemForm;
