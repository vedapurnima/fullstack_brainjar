import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Award, 
  Code, 
  BookOpen, 
  Star,
  ArrowLeft,
  Mail,
  MapPin,
  Link as LinkIcon,
  Edit,
  Trophy,
  Target,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import problemService from '../services/problemService';
import StarRating from './StarRating';
import './UserProfilePage.css';

const UserProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [userProblems, setUserProblems] = useState([]);
  const [userSolutions, setUserSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  const isOwnProfile = !userId || userId === currentUser?.id?.toString();

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileData = isOwnProfile 
        ? await userService.getCurrentUserProfile()
        : await userService.getUserProfile(userId);
      
      setProfile(profileData);
      setEditForm({
        name: profileData.name || '',
        email: profileData.email || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || ''
      });

      // Fetch user's problems and solutions
      const [problemsData, solutionsData] = await Promise.all([
        userService.getUserProblems(isOwnProfile ? currentUser.id : userId),
        userService.getUserSolutions(isOwnProfile ? currentUser.id : userId)
      ]);

      setUserProblems(problemsData);
      setUserSolutions(solutionsData);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user profile');
      navigate('/problems');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const updatedProfile = await userService.updateUserProfile(editForm);
      setProfile(updatedProfile);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateStats = () => {
    const totalProblems = userProblems.length;
    const totalSolutions = userSolutions.length;
    const avgRating = userProblems.length > 0 
      ? userProblems.reduce((sum, p) => sum + (p.average_rating || 0), 0) / userProblems.length
      : 0;

    return {
      totalProblems,
      totalSolutions,
      avgRating: avgRating.toFixed(1),
      joinDate: profile?.created_at ? formatDate(profile.created_at) : 'Unknown'
    };
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <h2>Profile not found</h2>
        <button onClick={() => navigate('/problems')} className="back-btn">
          <ArrowLeft size={20} />
          Back to Problems
        </button>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <motion.div 
      className="profile-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {/* Header */}
      <div className="profile-header">
        <button onClick={() => navigate('/problems')} className="back-btn">
          <ArrowLeft size={20} />
          Back to Problems
        </button>
        
        <div className="profile-header-content">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          
          <div className="profile-info">
            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="edit-form">
                <div className="form-row">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Full Name"
                    className="form-input"
                    required
                  />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Email"
                    className="form-input"
                    required
                  />
                </div>
                
                <textarea
                  value={editForm.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="form-textarea"
                  rows="3"
                />
                
                <div className="form-row">
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Location"
                    className="form-input"
                  />
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="Website"
                    className="form-input"
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={() => setEditMode(false)} className="cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="profile-name-section">
                  <h1 className="profile-name">{profile.name || 'Anonymous User'}</h1>
                  {isOwnProfile && (
                    <button onClick={() => setEditMode(true)} className="edit-btn">
                      <Edit size={16} />
                      Edit Profile
                    </button>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="profile-bio">{profile.bio}</p>
                )}
                
                <div className="profile-meta">
                  <div className="meta-item">
                    <Mail size={16} />
                    {profile.email}
                  </div>
                  {profile.location && (
                    <div className="meta-item">
                      <MapPin size={16} />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <div className="meta-item">
                      <LinkIcon size={16} />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer">
                        {profile.website}
                      </a>
                    </div>
                  )}
                  <div className="meta-item">
                    <Calendar size={16} />
                    Joined {stats.joinDate}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-card">
          <BookOpen size={24} />
          <div className="stat-content">
            <span className="stat-number">{stats.totalProblems}</span>
            <span className="stat-label">Problems Created</span>
          </div>
        </div>
        
        <div className="stat-card">
          <Code size={24} />
          <div className="stat-content">
            <span className="stat-number">{stats.totalSolutions}</span>
            <span className="stat-label">Solutions Submitted</span>
          </div>
        </div>
        
        <div className="stat-card">
          <Star size={24} />
          <div className="stat-content">
            <span className="stat-number">{stats.avgRating}</span>
            <span className="stat-label">Average Rating</span>
          </div>
        </div>
        
        <div className="stat-card">
          <Trophy size={24} />
          <div className="stat-content">
            <span className="stat-number">{stats.totalProblems + stats.totalSolutions}</span>
            <span className="stat-label">Total Contributions</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('problems')}
          className={`tab-btn ${activeTab === 'problems' ? 'active' : ''}`}
        >
          Problems ({userProblems.length})
        </button>
        <button 
          onClick={() => setActiveTab('solutions')}
          className={`tab-btn ${activeTab === 'solutions' ? 'active' : ''}`}
        >
          Solutions ({userSolutions.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="activity-summary">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {/* Show recent problems and solutions mixed */}
                {[...userProblems.slice(0, 3), ...userSolutions.slice(0, 3)]
                  .sort((a, b) => new Date(b.created_at || b.submitted_at) - new Date(a.created_at || a.submitted_at))
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        {item.title ? <BookOpen size={16} /> : <Code size={16} />}
                      </div>
                      <div className="activity-content">
                        <span className="activity-text">
                          {item.title ? `Created problem: ${item.title}` : `Solved problem: ${item.problem_title || 'Unknown'}`}
                        </span>
                        <span className="activity-date">
                          {formatDate(item.created_at || item.submitted_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                
                {userProblems.length === 0 && userSolutions.length === 0 && (
                  <div className="no-activity">
                    <Target size={32} />
                    <p>No activity yet. Start by creating problems or solving existing ones!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="problems-tab">
            {userProblems.length > 0 ? (
              <div className="problems-grid">
                {userProblems.map((problem) => (
                  <div key={problem.id} className="problem-card">
                    <h4 className="problem-card-title">{problem.title}</h4>
                    <p className="problem-card-category">{problem.category}</p>
                    <p className="problem-card-description">
                      {problem.description.substring(0, 150)}...
                    </p>
                    
                    <div className="problem-card-meta">
                      <div className="problem-card-date">
                        <Clock size={14} />
                        {formatDate(problem.created_at)}
                      </div>
                      {problem.average_rating > 0 && (
                        <div className="problem-card-rating">
                          <StarRating rating={problem.average_rating} readOnly size={14} />
                          <span>({problem.feedback_count || 0})</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-tab">
                <BookOpen size={48} />
                <h3>No Problems Created</h3>
                <p>This user hasn't created any problems yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'solutions' && (
          <div className="solutions-tab">
            {userSolutions.length > 0 ? (
              <div className="solutions-list">
                {userSolutions.map((solution, index) => (
                  <div key={index} className="solution-card">
                    <h4 className="solution-card-title">{solution.problem_title || `Solution #${index + 1}`}</h4>
                    <div className="solution-card-preview">
                      {solution.solution.substring(0, 200)}...
                    </div>
                    {solution.explanation && (
                      <p className="solution-card-explanation">
                        <strong>Explanation:</strong> {solution.explanation.substring(0, 100)}...
                      </p>
                    )}
                    <div className="solution-card-date">
                      <Clock size={14} />
                      Submitted {formatDate(solution.submitted_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-tab">
                <Code size={48} />
                <h3>No Solutions Submitted</h3>
                <p>This user hasn't submitted any solutions yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UserProfilePage;
