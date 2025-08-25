import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiHeart, FiEye, FiLoader } from 'react-icons/fi';
import { RiRobot2Line, RiWizardLine, RiNinjaMaskLine, RiAncientGateLine, RiSpaceShipLine, RiFlowerLine } from 'react-icons/ri';
import './CharacterCreator.css';

const CharacterCreator = ({ onClose, onCharacterCreated }) => {
  // Component states
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Character data
  const [characterData, setCharacterData] = useState({
    avatar: '',
    name: '',
    bio: '',
    personalityTraits: []
  });

  // Available avatars (synced with backend defaults)
  const availableAvatars = [
    {
      id: 'cyber-warrior',
      name: 'Cyber Warrior',
      description: 'A futuristic problem solver with advanced digital skills',
      image: '/avatars/cyber-warrior.png',
      icon: RiRobot2Line
    },
    {
      id: 'code-wizard',
      name: 'Code Wizard',
      description: 'Master of algorithms with magical programming abilities',
      image: '/avatars/code-wizard.png',
      icon: RiWizardLine
    },
    {
      id: 'debug-ninja',
      name: 'Debug Ninja',
      description: 'Silent but deadly bug hunter and code optimizer',
      image: '/avatars/debug-ninja.png',
      icon: RiNinjaMaskLine
    },
    {
      id: 'data-sage',
      name: 'Data Sage',
      description: 'Wise guardian of data structures and databases',
      image: '/avatars/data-sage.png',
      icon: RiAncientGateLine
    },
    {
      id: 'logic-explorer',
      name: 'Logic Explorer',
      description: 'Adventurous navigator of complex logical puzzles',
      image: '/avatars/logic-explorer.png',
      icon: RiSpaceShipLine
    },
    {
      id: 'pattern-botanist',
      name: 'Pattern Botanist',
      description: 'Cultivator of elegant algorithmic patterns and solutions',
      image: '/avatars/pattern-botanist.png',
      icon: RiFlowerLine
    }
  ];

  // Personality traits (synced with backend suggestions)
  const personalityTraits = [
    'Analytical',
    'Creative',
    'Persistent',
    'Collaborative',
    'Perfectionist',
    'Curious',
    'Strategic',
    'Innovative',
    'Detail-Oriented',
    'Problem-Solver',
    'Logical',
    'Intuitive',
    'Patient',
    'Adventurous',
    'Methodical'
  ];

  const maxTraits = 5;

  // Form validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return characterData.avatar !== '';
      case 2:
        return characterData.name.trim().length >= 2 && characterData.name.trim().length <= 30;
      case 3:
        return characterData.personalityTraits.length >= 2;
      default:
        return true;
    }
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatarId) => {
    setCharacterData(prev => ({
      ...prev,
      avatar: avatarId
    }));
  };

  // Handle name input
  const handleNameChange = (e) => {
    const name = e.target.value.slice(0, 30);
    setCharacterData(prev => ({
      ...prev,
      name
    }));
  };

  // Handle bio input
  const handleBioChange = (e) => {
    const bio = e.target.value.slice(0, 200);
    setCharacterData(prev => ({
      ...prev,
      bio
    }));
  };

  // Handle personality trait selection
  const handleTraitToggle = (trait) => {
    setCharacterData(prev => {
      const currentTraits = prev.personalityTraits;
      const isSelected = currentTraits.includes(trait);
      
      if (isSelected) {
        return {
          ...prev,
          personalityTraits: currentTraits.filter(t => t !== trait)
        };
      } else if (currentTraits.length < maxTraits) {
        return {
          ...prev,
          personalityTraits: [...currentTraits, trait]
        };
      }
      return prev;
    });
  };

  // Navigation
  const nextStep = () => {
    if (validateCurrentStep() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step) => {
    if (step <= currentStep || (step === currentStep + 1 && validateCurrentStep())) {
      setCurrentStep(step);
    }
  };

  // Create character
  const createCharacter = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          avatar: characterData.avatar,
          name: characterData.name.trim(),
          bio: characterData.bio.trim(),
          personality_traits: characterData.personalityTraits
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create character');
      }

      const newCharacter = await response.json();
      
      if (onCharacterCreated) {
        onCharacterCreated(newCharacter);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError('Failed to create character. Please try again.');
      console.error('Character creation error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Get selected avatar data
  const selectedAvatar = availableAvatars.find(avatar => avatar.id === characterData.avatar);

  // Component animations
  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  if (loading) {
    return (
      <div className="character-creator">
        <div className="character-creator-container">
          <motion.div 
            className="character-step"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={{ textAlign: 'center' }}>
              <FiLoader size={48} className="spinning" style={{ color: '#667eea', marginBottom: '16px' }} />
              <h2>Creating Your Character...</h2>
              <p>Setting up your coding persona</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error && !currentStep) {
    return (
      <div className="character-creator error">
        <div className="error-message">
          <FiUser size={48} />
          <h3>Character Creation Error</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={() => setError(null)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="character-creator">
      <div className="character-creator-container">
        {/* Step Navigation */}
        <motion.div 
          className="step-navigation"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {[1, 2, 3, 4].map((step) => (
            <motion.div
              key={step}
              className={`step-indicator ${currentStep >= step ? 'active' : ''}`}
              onClick={() => goToStep(step)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {step}
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Avatar Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              className="character-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="step-header">
                <FiUser size={48} />
                <h2>Choose Your Avatar</h2>
                <p>Select a character that represents your coding style</p>
              </div>

              {error && <div className="error-banner">{error}</div>}

              <div className="avatars-grid">
                {availableAvatars.map((avatar) => (
                  <motion.div
                    key={avatar.id}
                    className={`avatar-option ${characterData.avatar === avatar.id ? 'selected' : ''}`}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * availableAvatars.indexOf(avatar) }}
                  >
                    <div className="selection-indicator"></div>
                    <avatar.icon size={80} style={{ marginBottom: '16px' }} />
                    <div className="avatar-info">
                      <h3>{avatar.name}</h3>
                      <p>{avatar.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="step-buttons">
                <div></div>
                <button 
                  className="next-btn" 
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Basic Information */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              className="character-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="step-header">
                <FiHeart size={48} />
                <h2>Character Details</h2>
                <p>Give your character a name and personality</p>
              </div>

              {error && <div className="error-banner">{error}</div>}

              <div className="form-group">
                <label>Character Name *</label>
                <input
                  type="text"
                  value={characterData.name}
                  onChange={handleNameChange}
                  placeholder="Enter your character's name..."
                  maxLength={30}
                />
                <div className="char-count">{characterData.name.length}/30</div>
              </div>

              <div className="form-group">
                <label>Bio (Optional)</label>
                <textarea
                  value={characterData.bio}
                  onChange={handleBioChange}
                  placeholder="Describe your character's background and coding journey..."
                  rows={4}
                  maxLength={200}
                />
                <div className="char-count">{characterData.bio.length}/200</div>
              </div>

              <div className="step-buttons">
                <button className="back-btn" onClick={prevStep}>
                  Back
                </button>
                <button 
                  className="next-btn" 
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Personality Traits */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              className="character-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="step-header">
                <FiEye size={48} />
                <h2>Personality Traits</h2>
                <p>Select traits that best describe your coding approach</p>
              </div>

              {error && <div className="error-banner">{error}</div>}

              <div className="selected-count">
                {characterData.personalityTraits.length} of {maxTraits} traits selected (minimum 2)
              </div>

              <div className="traits-grid">
                {personalityTraits.map((trait) => (
                  <motion.div
                    key={trait}
                    className={`trait-option ${characterData.personalityTraits.includes(trait) ? 'selected' : ''}`}
                    onClick={() => handleTraitToggle(trait)}
                    disabled={!characterData.personalityTraits.includes(trait) && characterData.personalityTraits.length >= maxTraits}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * personalityTraits.indexOf(trait) }}
                  >
                    <div className="trait-indicator"></div>
                    {trait}
                  </motion.div>
                ))}
              </div>

              <div className="step-buttons">
                <button className="back-btn" onClick={prevStep}>
                  Back
                </button>
                <button 
                  className="next-btn" 
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                >
                  Preview
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Character Preview */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              className="character-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="step-header">
                <FiUser size={48} />
                <h2>Character Preview</h2>
                <p>Review your character before creating</p>
              </div>

              {error && <div className="error-banner">{error}</div>}

              <motion.div 
                className="character-preview-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="preview-avatar">
                  {selectedAvatar && <selectedAvatar.icon size={120} />}
                </div>
                <div className="preview-info">
                  <h3>{characterData.name}</h3>
                  {characterData.bio && (
                    <p className="preview-bio">{characterData.bio}</p>
                  )}
                  <div className="preview-traits">
                    <h4>Personality Traits</h4>
                    <div className="traits-list">
                      {characterData.personalityTraits.map((trait) => (
                        <span key={trait} className="trait-tag">{trait}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="step-buttons">
                <button className="back-btn" onClick={prevStep}>
                  Back
                </button>
                <button 
                  className="save-btn" 
                  onClick={createCharacter}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <FiLoader className="spinning" />
                      Creating...
                    </>
                  ) : (
                    'Create Character'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CharacterCreator;
