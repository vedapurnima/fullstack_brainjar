import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiCode, 
  FiBook, 
  FiVideo, 
  FiTag, 
  FiSave,
  FiX,
  FiLink,
  FiTrash2,
  FiAlertCircle,
  FiCheck
} from 'react-icons/fi';
import './EnhancedProblemCreator.css';

const EnhancedProblemCreator = ({ onClose, onProblemCreated, existingProblem }) => {
  const [problemData, setProblemData] = useState({
    title: '',
    description: '',
    difficulty_level: 'Medium',
    tags: [],
    documentation_links: [],
    video_references: []
  });

  const [newTag, setNewTag] = useState('');
  const [newDocLink, setNewDocLink] = useState({ title: '', url: '' });
  const [newVideoLink, setNewVideoLink] = useState({ title: '', url: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const difficultyLevels = ['Easy', 'Medium', 'Hard', 'Expert'];
  const suggestionTags = [
    'Arrays', 'Strings', 'Dynamic Programming', 'Graphs', 'Trees', 
    'Binary Search', 'Sorting', 'Hash Tables', 'Recursion', 'Greedy',
    'Backtracking', 'Two Pointers', 'Sliding Window', 'Stack', 'Queue',
    'Linked Lists', 'Math', 'Bit Manipulation', 'Divide & Conquer'
  ];

  useEffect(() => {
    if (existingProblem) {
      setProblemData({
        title: existingProblem.title || '',
        description: existingProblem.description || '',
        difficulty_level: existingProblem.difficulty_level || 'Medium',
        tags: existingProblem.tags || [],
        documentation_links: existingProblem.documentation_links || [],
        video_references: existingProblem.video_references || []
      });
    }
  }, [existingProblem]);

  const validateForm = () => {
    const errors = {};
    
    if (!problemData.title.trim()) {
      errors.title = 'Title is required';
    } else if (problemData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }
    
    if (!problemData.description.trim()) {
      errors.description = 'Description is required';
    } else if (problemData.description.length < 50) {
      errors.description = 'Description must be at least 50 characters';
    }

    if (problemData.tags.length === 0) {
      errors.tags = 'At least one tag is required';
    }

    // Validate documentation links
    problemData.documentation_links.forEach((link, index) => {
      if (!link.url || !isValidUrl(link.url)) {
        errors[`docLink${index}`] = 'Invalid documentation URL';
      }
    });

    // Validate video links
    problemData.video_references.forEach((link, index) => {
      if (!link.url || !isValidUrl(link.url)) {
        errors[`videoLink${index}`] = 'Invalid video URL';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setProblemData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addTag = (tag) => {
    if (!tag.trim()) return;
    
    const trimmedTag = tag.trim();
    if (!problemData.tags.includes(trimmedTag)) {
      setProblemData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove) => {
    setProblemData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addDocumentationLink = () => {
    if (!newDocLink.title.trim() || !newDocLink.url.trim()) return;
    if (!isValidUrl(newDocLink.url)) {
      setError('Please enter a valid documentation URL');
      return;
    }

    setProblemData(prev => ({
      ...prev,
      documentation_links: [...prev.documentation_links, { ...newDocLink }]
    }));
    setNewDocLink({ title: '', url: '' });
    setError(null);
  };

  const removeDocumentationLink = (index) => {
    setProblemData(prev => ({
      ...prev,
      documentation_links: prev.documentation_links.filter((_, i) => i !== index)
    }));
  };

  const addVideoReference = () => {
    if (!newVideoLink.title.trim() || !newVideoLink.url.trim()) return;
    if (!isValidUrl(newVideoLink.url)) {
      setError('Please enter a valid video URL');
      return;
    }

    setProblemData(prev => ({
      ...prev,
      video_references: [...prev.video_references, { ...newVideoLink }]
    }));
    setNewVideoLink({ title: '', url: '' });
    setError(null);
  };

  const removeVideoReference = (index) => {
    setProblemData(prev => ({
      ...prev,
      video_references: prev.video_references.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors below');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = existingProblem ? `/api/problems/${existingProblem.id}` : '/api/problems';
      const method = existingProblem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(problemData)
      });

      if (!response.ok) {
        throw new Error('Failed to save problem');
      }

      const savedProblem = await response.json();
      
      if (onProblemCreated) {
        onProblemCreated(savedProblem);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError('Failed to save problem. Please try again.');
      console.error('Problem save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enhanced-problem-creator">
      <div className="creator-container">
        <motion.div 
          className="creator-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-content">
            <FiCode size={32} />
            <div>
              <h2>{existingProblem ? 'Edit Problem' : 'Create New Problem'}</h2>
              <p>Design a comprehensive coding challenge with learning resources</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </motion.div>

        <div className="creator-content">
          {error && (
            <motion.div 
              className="error-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FiAlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <div className="form-sections">
            {/* Basic Information */}
            <motion.div 
              className="form-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3>
                <FiCode size={20} />
                Problem Details
              </h3>
              
              <div className="form-group">
                <label>Problem Title *</label>
                <input
                  type="text"
                  value={problemData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Two Sum, Binary Tree Traversal..."
                  maxLength={200}
                  className={validationErrors.title ? 'error' : ''}
                />
                {validationErrors.title && (
                  <span className="error-text">{validationErrors.title}</span>
                )}
                <div className="char-count">{problemData.title.length}/200</div>
              </div>

              <div className="form-group">
                <label>Difficulty Level *</label>
                <div className="difficulty-selector">
                  {difficultyLevels.map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`difficulty-btn ${problemData.difficulty_level === level ? 'selected' : ''} ${level.toLowerCase()}`}
                      onClick={() => handleInputChange('difficulty_level', level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Problem Description *</label>
                <textarea
                  value={problemData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide a detailed description of the problem, including constraints, examples, and expected solution approach..."
                  rows={8}
                  className={validationErrors.description ? 'error' : ''}
                />
                {validationErrors.description && (
                  <span className="error-text">{validationErrors.description}</span>
                )}
                <div className="char-count">{problemData.description.length} characters</div>
              </div>
            </motion.div>

            {/* Tags Section */}
            <motion.div 
              className="form-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3>
                <FiTag size={20} />
                Tags & Categories
              </h3>
              
              <div className="form-group">
                <label>Problem Tags *</label>
                <div className="tags-input">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(newTag);
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => addTag(newTag)}
                    className="add-tag-btn"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>
                
                <div className="suggested-tags">
                  <p>Suggested tags:</p>
                  <div className="tags-list">
                    {suggestionTags.filter(tag => !problemData.tags.includes(tag)).slice(0, 10).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        className="suggested-tag"
                        onClick={() => addTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="selected-tags">
                  <AnimatePresence>
                    {problemData.tags.map(tag => (
                      <motion.div
                        key={tag}
                        className="tag-item"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        layout
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="remove-tag"
                        >
                          <FiX size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {validationErrors.tags && (
                  <span className="error-text">{validationErrors.tags}</span>
                )}
              </div>
            </motion.div>

            {/* Documentation Links */}
            <motion.div 
              className="form-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3>
                <FiBook size={20} />
                Documentation & Resources
              </h3>
              
              <div className="form-group">
                <label>Add Documentation Links</label>
                <div className="link-input-group">
                  <input
                    type="text"
                    value={newDocLink.title}
                    onChange={(e) => setNewDocLink(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Link title (e.g., 'Array Methods Documentation')"
                  />
                  <input
                    type="url"
                    value={newDocLink.url}
                    onChange={(e) => setNewDocLink(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                  />
                  <button 
                    type="button" 
                    onClick={addDocumentationLink}
                    className="add-link-btn"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>

                <div className="links-list">
                  <AnimatePresence>
                    {problemData.documentation_links.map((link, index) => (
                      <motion.div
                        key={index}
                        className="link-item"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="link-content">
                          <FiLink size={16} />
                          <div>
                            <h4>{link.title}</h4>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocumentationLink(index)}
                          className="remove-link"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Video References */}
            <motion.div 
              className="form-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3>
                <FiVideo size={20} />
                Video Tutorials & Explanations
              </h3>
              
              <div className="form-group">
                <label>Add Video References</label>
                <div className="link-input-group">
                  <input
                    type="text"
                    value={newVideoLink.title}
                    onChange={(e) => setNewVideoLink(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Video title (e.g., 'Dynamic Programming Explained')"
                  />
                  <input
                    type="url"
                    value={newVideoLink.url}
                    onChange={(e) => setNewVideoLink(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="YouTube, Vimeo, or other video URL..."
                  />
                  <button 
                    type="button" 
                    onClick={addVideoReference}
                    className="add-link-btn"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>

                <div className="links-list">
                  <AnimatePresence>
                    {problemData.video_references.map((link, index) => (
                      <motion.div
                        key={index}
                        className="link-item video-link"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="link-content">
                          <FiVideo size={16} />
                          <div>
                            <h4>{link.title}</h4>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVideoReference(index)}
                          className="remove-link"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="creator-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="save-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <motion.div
                    className="spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <FiCode size={16} />
                  </motion.div>
                  {existingProblem ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  {existingProblem ? 'Update Problem' : 'Create Problem'}
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProblemCreator;
