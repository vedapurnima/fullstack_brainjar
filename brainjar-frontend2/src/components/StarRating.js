import React from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

const StarRating = ({ 
  rating = 0, 
  onRatingChange = null, 
  size = 20, 
  readOnly = false,
  interactive = false 
}) => {
  const isInteractive = !readOnly && (interactive || onRatingChange);
  const maxStars = 5;

  const handleStarClick = (starNumber) => {
    if (isInteractive && onRatingChange) {
      onRatingChange(starNumber);
    }
  };

  const handleKeyDown = (e, starNumber) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleStarClick(starNumber);
    }
  };

  return (
    <div className={`star-rating ${isInteractive ? 'interactive' : ''}`}>
      {[...Array(maxStars)].map((_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= rating;
        const isHalfFilled = !isFilled && starNumber <= rating + 0.5;

        return (
          <span
            key={index}
            className={`star ${isFilled ? 'filled' : ''} ${isHalfFilled ? 'half-filled' : ''}`}
            onClick={() => handleStarClick(starNumber)}
            onKeyDown={(e) => handleKeyDown(e, starNumber)}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            aria-label={`Rate ${starNumber} star${starNumber > 1 ? 's' : ''}`}
            style={{ fontSize: `${size}px` }}
          >
            <Star 
              size={size}
              fill={isFilled ? 'currentColor' : 'none'}
              stroke={isFilled || isHalfFilled ? 'currentColor' : 'currentColor'}
            />
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
