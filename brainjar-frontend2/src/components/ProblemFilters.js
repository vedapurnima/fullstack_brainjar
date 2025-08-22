import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Sliders } from 'lucide-react';
import './ProblemFilters.css';

const ProblemFilters = ({ problems = [], onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock categories and difficulties - in real app, these would come from API
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const categories = ['Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting'];

  React.useEffect(() => {
    applyFilters();
  }, [searchTerm, difficultyFilter, categoryFilter, problems]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => {
    let filtered = [...problems];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(problem => 
        (problem.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (problem.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(problem => 
        (problem.difficulty || 'Easy').toLowerCase() === difficultyFilter.toLowerCase()
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(problem => 
        (problem.category || 'Arrays').toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    onFilter?.(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDifficultyFilter('all');
    setCategoryFilter('all');
  };

  const activeFilters = [
    searchTerm && 'search',
    difficultyFilter !== 'all' && 'difficulty',
    categoryFilter !== 'all' && 'category'
  ].filter(Boolean).length;

  return (
    <div className="problem-filters">
      <div className="filters-header">
        <div className="filters-title">
          <Filter size={16} />
          <span>Filters</span>
          {activeFilters > 0 && (
            <span className="active-filters-count">{activeFilters}</span>
          )}
        </div>
        <button
          className="expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <Sliders size={16} />
        </button>
      </div>

      <motion.div 
        className="filters-content"
        initial={false}
        animate={{ 
          height: isExpanded ? "auto" : "60px",
          opacity: isExpanded ? 1 : 0.7
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Search Filter */}
        <div className="filter-group">
          <label className="filter-label">Search Problems</label>
          <div className="search-input-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description..."
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Difficulty Filter */}
            <div className="filter-group">
              <label className="filter-label">Difficulty</label>
              <div className="filter-options">
                <button
                  className={`filter-option ${difficultyFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDifficultyFilter('all')}
                >
                  All
                </button>
                {difficulties.map(difficulty => (
                  <button
                    key={difficulty}
                    className={`filter-option difficulty-${difficulty.toLowerCase()} ${
                      difficultyFilter === difficulty.toLowerCase() ? 'active' : ''
                    }`}
                    onClick={() => setDifficultyFilter(difficulty.toLowerCase())}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <div className="filter-options">
                <button
                  className={`filter-option ${categoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('all')}
                >
                  All
                </button>
                {categories.slice(0, 4).map(category => (
                  <button
                    key={category}
                    className={`filter-option ${
                      categoryFilter === category.toLowerCase() ? 'active' : ''
                    }`}
                    onClick={() => setCategoryFilter(category.toLowerCase())}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Actions */}
            {activeFilters > 0 && (
              <div className="filter-actions">
                <button className="reset-filters-btn" onClick={resetFilters}>
                  Reset Filters
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Results Summary */}
      <div className="filter-results">
        <span className="results-text">
          {problems.length === 0 ? 'No problems found' : 
           `Showing ${problems.length} problem${problems.length !== 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
};

export default ProblemFilters;
