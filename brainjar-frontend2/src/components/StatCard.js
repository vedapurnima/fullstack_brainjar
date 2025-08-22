import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './StatCard.css';

const StatCard = ({ title, value, icon, gradient = 'primary', delay = 0 }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      animateCounter(value);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const animateCounter = (target) => {
    let current = 0;
    const increment = target / 30;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedValue(target);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(current));
      }
    }, 50);
  };

  const gradientClass = {
    primary: 'stat-card-primary',
    secondary: 'stat-card-secondary',
    accent: 'stat-card-accent'
  };

  return (
    <motion.div 
      className={`stat-card ${gradientClass[gradient]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}
    >
      <div className="stat-icon">
        {icon}
      </div>
      <div className="stat-content">
        <motion.h3 
          className="stat-value"
          key={animatedValue}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {animatedValue.toLocaleString()}
        </motion.h3>
        <p className="stat-title">{title}</p>
      </div>
      <div className="stat-background">
        <div className="stat-gradient"></div>
      </div>
    </motion.div>
  );
};

export default StatCard;
