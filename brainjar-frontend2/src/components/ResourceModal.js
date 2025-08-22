import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, BookOpen, Video, FileText, Code } from 'lucide-react';
import './ResourceModal.css';

const ResourceModal = ({ isOpen, onClose, problem }) => {
  const resources = [
    {
      id: 1,
      title: 'LeetCode Editorial',
      type: 'article',
      description: 'Official solution with detailed explanation',
      url: 'https://leetcode.com',
      icon: <Code size={18} />
    },
    {
      id: 2,
      title: 'Algorithm Visualization',
      type: 'interactive',
      description: 'Visual representation of the algorithm',
      url: 'https://visualgo.net',
      icon: <Video size={18} />
    },
    {
      id: 3,
      title: 'GeeksforGeeks Tutorial',
      type: 'article',
      description: 'Comprehensive tutorial with examples',
      url: 'https://geeksforgeeks.org',
      icon: <FileText size={18} />
    },
    {
      id: 4,
      title: 'YouTube Explanation',
      type: 'video',
      description: 'Step-by-step video walkthrough',
      url: 'https://youtube.com',
      icon: <Video size={18} />
    },
    {
      id: 5,
      title: 'Algorithm Design Manual',
      type: 'book',
      description: 'Chapter reference in Skiena\'s book',
      url: 'https://algorist.com',
      icon: <BookOpen size={18} />
    },
    {
      id: 6,
      title: 'HackerRank Practice',
      type: 'practice',
      description: 'Similar problems for practice',
      url: 'https://hackerrank.com',
      icon: <Code size={18} />
    }
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case 'article': return 'var(--primary-color)';
      case 'video': return 'var(--error-color)';
      case 'interactive': return 'var(--accent-color)';
      case 'book': return 'var(--success-color)';
      case 'practice': return 'var(--warning-color)';
      default: return 'var(--text-muted)';
    }
  };

  const openResource = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="resource-modal"
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-title">
              <BookOpen size={20} />
              <h2>Learning Resources</h2>
            </div>
            <button className="close-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>

          <div className="modal-content">
            <div className="resources-intro">
              <p>
                Here are some curated resources to help you understand and master{' '}
                {problem?.title ? `"${problem.title}"` : 'coding concepts'}:
              </p>
            </div>

            <div className="resources-grid">
              {resources.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  className="resource-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => openResource(resource.url)}
                >
                  <div className="resource-header">
                    <div 
                      className="resource-icon"
                      style={{ color: getTypeColor(resource.type) }}
                    >
                      {resource.icon}
                    </div>
                    <div className="resource-type">
                      <span 
                        className="type-badge"
                        style={{ backgroundColor: getTypeColor(resource.type) }}
                      >
                        {resource.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="resource-content">
                    <h3 className="resource-title">{resource.title}</h3>
                    <p className="resource-description">{resource.description}</p>
                  </div>
                  
                  <div className="resource-footer">
                    <div className="external-link">
                      <ExternalLink size={14} />
                      <span>Open in new tab</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="resources-footer">
              <div className="resource-tip">
                <p>
                  💡 <strong>Tip:</strong> Try multiple resources to get different perspectives 
                  on the same concept. Visual learners might prefer videos and interactive tools, 
                  while others might prefer written explanations.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResourceModal;
