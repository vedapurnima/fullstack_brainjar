import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HiTrophy as Trophy,
  HiFlag as Target,
  HiFire as Flame,
  HiUsers as Users,
  HiBookOpen as BookOpen,
  HiAdjustmentsHorizontal as Filter,
  HiCheckBadge as Award,
  HiBolt as Zap,
  HiArrowTrendingUp as TrendingUp,
  HiClock as Clock,
  HiOutlineStar as Star,
  HiChatBubbleLeftRight as Chat
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Leaderboard from '../components/Leaderboard';
import BadgeDisplay from '../components/BadgeDisplay';
import ProblemFilters from '../components/ProblemFilters';
import FriendSuggestions from '../components/FriendSuggestions';
import FriendRecommendations from '../components/FriendRecommendations';
import FriendsList from '../components/FriendsList';
import ProblemsSolved from '../components/ProblemsSolved';
import StreakTracker from '../components/StreakTracker';
import ChatInterface from '../components/ChatInterface';
import SkeletonLoader from '../components/SkeletonLoader';
import ResourceModal from '../components/ResourceModal';
import './Dashboard_Modern.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  // State management
  const [stats, setStats] = useState({
    problemsSolved: 0,
    currentStreak: 0,
    friends: 0,
    totalPoints: 0
  });
  
  const [problems, setProblems] = useState([]);
  const [friends, setFriends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  
  // New modal states
  const [showFriendRecommendations, setShowFriendRecommendations] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [showProblemsSolved, setShowProblemsSolved] = useState(false);
  const [showStreakTracker, setShowStreakTracker] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [chatInitialUser, setChatInitialUser] = useState(null);
  
  // Badges based on problems solved
  const badges = [
    { id: 1, name: 'First Steps', icon: '🚀', description: 'Solved your first problem', threshold: 1 },
    { id: 2, name: 'Getting Started', icon: '⭐', description: 'Solved 5 problems', threshold: 5 },
    { id: 3, name: 'Problem Solver', icon: '🎯', description: 'Solved 10 problems', threshold: 10 },
    { id: 4, name: 'Code Warrior', icon: '⚔️', description: 'Solved 25 problems', threshold: 25 },
    { id: 5, name: 'Algorithm Master', icon: '👑', description: 'Solved 50 problems', threshold: 50 },
    { id: 6, name: 'Coding Legend', icon: '🏆', description: 'Solved 100 problems', threshold: 100 }
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Parallel API calls for better performance
      const [problemsRes, friendsRes, streaksRes] = await Promise.allSettled([
        api.get('/problems').catch(() => ({ data: [] })),
        api.get('/friends').catch(() => ({ data: [] })),
        api.get('/streaks').catch(() => ({ data: [] }))
      ]);

      // Handle problems data
      const problemsData = problemsRes.status === 'fulfilled' ? problemsRes.value.data : [];
      setProblems(problemsData);

      // Handle friends data  
      const friendsData = friendsRes.status === 'fulfilled' ? friendsRes.value.data : [];
      setFriends(friendsData);
      
      // Create mock leaderboard from friends data or generate mock data
      let leaderboardData = [];
      if (friendsData.length > 0) {
        leaderboardData = friendsData.slice(0, 10).map((friend, index) => ({
          id: friend.id,
          username: friend.name || friend.username,
          problems_solved: Math.floor(Math.random() * 100) + 10,
          streak: Math.floor(Math.random() * 30) + 1,
          rank: index + 1
        }));
      } else {
        // Generate mock leaderboard data
        leaderboardData = [
          { id: 1, username: 'CodeMaster', problems_solved: 150, streak: 25, rank: 1 },
          { id: 2, username: 'AlgoWiz', problems_solved: 142, streak: 18, rank: 2 },
          { id: 3, username: 'DataNinja', problems_solved: 138, streak: 22, rank: 3 },
          { id: 4, username: 'LogicLord', problems_solved: 125, streak: 15, rank: 4 },
          { id: 5, username: 'CodeCrafter', problems_solved: 118, streak: 12, rank: 5 }
        ];
      }
      setLeaderboard(leaderboardData);

      // Handle streaks data
      const streaksData = streaksRes.status === 'fulfilled' ? streaksRes.value.data : [];
      const currentStreak = streaksData.length > 0 ? streaksData[0].count : Math.floor(Math.random() * 15) + 1;
      
      setStats({
        problemsSolved: problemsData.length || Math.floor(Math.random() * 50) + 5,
        currentStreak: currentStreak,
        friends: friendsData.length || Math.floor(Math.random() * 20) + 3,
        totalPoints: ((problemsData.length || 15) * 10) + (currentStreak * 5)
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set comprehensive mock data on error
      setStats({
        problemsSolved: 23,
        currentStreak: 7,
        friends: 12,
        totalPoints: 275
      });
      
      setLeaderboard([
        { id: 1, username: 'CodeMaster', problems_solved: 150, streak: 25, rank: 1 },
        { id: 2, username: 'AlgoWiz', problems_solved: 142, streak: 18, rank: 2 },
        { id: 3, username: 'DataNinja', problems_solved: 138, streak: 22, rank: 3 },
        { id: 4, username: 'LogicLord', problems_solved: 125, streak: 15, rank: 4 },
        { id: 5, username: 'CodeCrafter', problems_solved: 118, streak: 12, rank: 5 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleProblemFilter = (filteredData) => {
    // Handle filtered problems data
    console.log('Filtered problems:', filteredData);
  };

  const openResourceModal = (problem) => {
    setSelectedProblem(problem);
    setShowResourceModal(true);
  };

  const handleStartChat = (userId, username) => {
    // Set the initial user for the chat
    setChatInitialUser({ userId, username });
    // Open the chat interface
    setShowChatInterface(true);
    // Show a toast to confirm the action
    toast.success(`Opening chat with ${username}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <motion.div 
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div className="dashboard-header" variants={itemVariants}>
        <div className="header-content">
          <h1 className="header-title">
            Welcome back, {user?.username}! 🎉
          </h1>
          <p className="header-subtitle">
            Ready to solve some problems and climb the leaderboard?
          </p>
        </div>
        <div className="header-actions">
          <motion.div 
            className="streak-indicator"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Flame size={24} />
            <span>{stats.currentStreak} day streak!</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Card Grid Layout */}
      <div className="dashboard-grid">
        {/* Top Row - Quick Stats */}
        <motion.div className="stat-card-container" variants={itemVariants}>
          <div className="stat-cards-row">
            <div className="stat-card primary">
              <div className="stat-icon">
                <Trophy size={28} />
              </div>
              <div className="stat-content">
                <h3>Problems Solved</h3>
                <p className="stat-number">{stats.problemsSolved}</p>
                <span className="stat-label">Total completed</span>
              </div>
            </div>
            
            <div className="stat-card accent">
              <div className="stat-icon">
                <Flame size={28} />
              </div>
              <div className="stat-content">
                <h3>Current Streak</h3>
                <p className="stat-number">{stats.currentStreak}</p>
                <span className="stat-label">Days in a row</span>
              </div>
            </div>
            
            <div className="stat-card secondary">
              <div className="stat-icon">
                <Users size={28} />
              </div>
              <div className="stat-content">
                <h3>Friends</h3>
                <p className="stat-number">{stats.friends}</p>
                <span className="stat-label">Connected coders</span>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon">
                <Star size={28} />
              </div>
              <div className="stat-content">
                <h3>Total Points</h3>
                <p className="stat-number">{stats.totalPoints}</p>
                <span className="stat-label">Achievement points</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="main-content-grid">
          {/* Large Card - Leaderboard */}
          <motion.div className="large-card leaderboard-card" variants={itemVariants}>
            <div className="card-header">
              <div className="card-title">
                <TrendingUp size={24} />
                <h3>Leaderboard</h3>
              </div>
              <span className="card-badge">Top 10</span>
            </div>
            <div className="card-content">
              <Leaderboard data={leaderboard} currentUser={user?.username} />
            </div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div className="medium-card actions-card" variants={itemVariants}>
            <div className="card-header">
              <div className="card-title">
                <Zap size={24} />
                <h3>Quick Actions</h3>
              </div>
            </div>
            <div className="card-content">
              <div className="action-grid">
                <button 
                  className="action-button primary"
                  onClick={() => openResourceModal({ title: 'General Resources' })}
                >
                  <BookOpen size={20} />
                  <span>Browse Resources</span>
                </button>
                <button 
                  className="action-button secondary"
                  onClick={() => setShowProblemsSolved(true)}
                >
                  <Target size={20} />
                  <span>View Solved</span>
                </button>
                <button 
                  className="action-button accent"
                  onClick={() => setShowFriendRecommendations(true)}
                >
                  <Users size={20} />
                  <span>Find Friends</span>
                </button>
                <button 
                  className="action-button chat"
                  onClick={() => setShowChatInterface(true)}
                >
                  <Chat size={20} />
                  <span>Open Chat</span>
                </button>
                <button 
                  className="action-button success"
                  onClick={() => setShowStreakTracker(true)}
                >
                  <Flame size={20} />
                  <span>Track Streak</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Achievements Card */}
          <motion.div className="medium-card achievements-card" variants={itemVariants}>
            <div className="card-header">
              <div className="card-title">
                <Award size={24} />
                <h3>Achievements</h3>
              </div>
              <span className="card-badge">Latest</span>
            </div>
            <div className="card-content">
              <BadgeDisplay 
                badges={badges} 
                problemsSolved={stats.problemsSolved}
              />
            </div>
          </motion.div>

          {/* Friends Card */}
          <motion.div className="medium-card friends-card" variants={itemVariants}>
            <div className="card-header">
              <div className="card-title">
                <Users size={24} />
                <h3>Friends</h3>
              </div>
              <button 
                className="card-action-btn"
                onClick={() => setShowFriendsList(true)}
              >
                View All
              </button>
            </div>
            <div className="card-content">
              <FriendSuggestions 
                friends={friends} 
                onMessageClick={handleStartChat}
              />
            </div>
          </motion.div>

          {/* Activity Card */}
          <motion.div className="wide-card activity-card" variants={itemVariants}>
            <div className="card-header">
              <div className="card-title">
                <Clock size={24} />
                <h3>Recent Activity</h3>
              </div>
            </div>
            <div className="card-content">
              <div className="activity-timeline">
                <div className="activity-item">
                  <div className="activity-dot success"></div>
                  <div className="activity-details">
                    <p>Solved "Two Sum" problem</p>
                    <span className="activity-time">2 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-dot primary"></div>
                  <div className="activity-details">
                    <p>Added a new friend</p>
                    <span className="activity-time">1 day ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-dot accent"></div>
                  <div className="activity-details">
                    <p>Achieved 7-day streak</p>
                    <span className="activity-time">2 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Problem Filters Card */}
          <motion.div className="small-card filters-card" variants={itemVariants}>
            <div className="card-header">
              <div className="card-title">
                <Filter size={24} />
                <h3>Problem Filters</h3>
              </div>
            </div>
            <div className="card-content">
              <ProblemFilters 
                problems={problems}
                onFilter={handleProblemFilter}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Resource Modal */}
      <ResourceModal 
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        problem={selectedProblem}
      />

      {/* New Feature Modals */}
      <FriendRecommendations
        isOpen={showFriendRecommendations}
        onClose={() => setShowFriendRecommendations(false)}
      />
      
      <FriendsList
        isOpen={showFriendsList}
        onClose={() => setShowFriendsList(false)}
      />
      
      <ProblemsSolved
        isOpen={showProblemsSolved}
        onClose={() => setShowProblemsSolved(false)}
      />
      
      <StreakTracker
        isOpen={showStreakTracker}
        onClose={() => setShowStreakTracker(false)}
      />
      
      <ChatInterface
        isOpen={showChatInterface}
        onClose={() => {
          setShowChatInterface(false);
          setChatInitialUser(null);
        }}
        initialUserId={chatInitialUser?.userId}
        initialUsername={chatInitialUser?.username}
      />
    </motion.div>
  );
};

export default Dashboard;
