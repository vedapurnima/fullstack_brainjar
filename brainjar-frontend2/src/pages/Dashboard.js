import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Flame, 
  Users, 
  BookOpen,
  Filter,
  Award,
  Zap,
  Star,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Leaderboard from '../components/Leaderboard';
import BadgeDisplay from '../components/BadgeDisplay';
import ProblemFilters from '../components/ProblemFilters';
import FriendSuggestions from '../components/FriendSuggestions';
import SkeletonLoader from '../components/SkeletonLoader';
import ResourceModal from '../components/ResourceModal';
import './Dashboard.css';

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
        api.get('/problems'),
        api.get('/friends'),
        api.get('/streaks')
      ]);

      // Handle problems data
      if (problemsRes.status === 'fulfilled') {
        const problemsData = problemsRes.value.data || [];
        setProblems(problemsData);
      }

      // Handle friends data
      if (friendsRes.status === 'fulfilled') {
        const friendsData = friendsRes.value.data || [];
        setFriends(friendsData);
        
        // Create mock leaderboard from friends data
        const leaderboardData = friendsData.slice(0, 10).map((friend, index) => ({
          id: friend.id,
          username: friend.name || friend.username,
          problems_solved: Math.floor(Math.random() * 100) + 10,
          streak: Math.floor(Math.random() * 30) + 1,
          rank: index + 1
        }));
        setLeaderboard(leaderboardData);
      }

      // Handle streaks data
      if (streaksRes.status === 'fulfilled') {
        const streaksData = streaksRes.value.data || [];
        const currentStreak = streaksData.length > 0 ? streaksData[0].count : 0;
        
        setStats(prevStats => ({
          ...prevStats,
          problemsSolved: problems.length || Math.floor(Math.random() * 50),
          currentStreak: currentStreak,
          friends: friends.length || Math.floor(Math.random() * 20),
          totalPoints: (problems.length || 0) * 10 + currentStreak * 5
        }));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data on error
      setStats({
        problemsSolved: 23,
        currentStreak: 7,
        friends: 12,
        totalPoints: 275
      });
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

      {/* Stats Grid */}
      <motion.div className="stats-section" variants={itemVariants}>
        <div className="stats-grid">
          <StatCard
            title="Problems Solved"
            value={stats.problemsSolved}
            icon={<Trophy size={24} />}
            gradient="primary"
            delay={0.1}
          />
          <StatCard
            title="Current Streak"
            value={stats.currentStreak}
            icon={<Flame size={24} />}
            gradient="accent"
            delay={0.2}
          />
          <StatCard
            title="Friends"
            value={stats.friends}
            icon={<Users size={24} />}
            gradient="secondary"
            delay={0.3}
          />
          <StatCard
            title="Total Points"
            value={stats.totalPoints}
            icon={<Star size={24} />}
            gradient="primary"
            delay={0.4}
          />
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="dashboard-main">
        {/* Left Column */}
        <div className="dashboard-left">
          {/* Badges Section */}
          <motion.div className="section-card" variants={itemVariants}>
            <div className="section-header">
              <h2><Award size={20} />Achievements</h2>
            </div>
            <BadgeDisplay 
              badges={badges} 
              problemsSolved={stats.problemsSolved}
            />
          </motion.div>

          {/* Quick Actions */}
          <motion.div className="section-card" variants={itemVariants}>
            <div className="section-header">
              <h2><Zap size={20} />Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <button 
                className="action-btn primary"
                onClick={() => openResourceModal({ title: 'General Resources' })}
              >
                <BookOpen size={18} />
                Browse Resources
              </button>
              <button className="action-btn secondary">
                <Target size={18} />
                Practice Problems
              </button>
              <button className="action-btn secondary">
                <Users size={18} />
                Find Friends
              </button>
            </div>
          </motion.div>

          {/* Friend Suggestions */}
          <motion.div className="section-card" variants={itemVariants}>
            <div className="section-header">
              <h2><Users size={20} />Friend Suggestions</h2>
            </div>
            <FriendSuggestions friends={friends} />
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          {/* Leaderboard */}
          <motion.div className="section-card" variants={itemVariants}>
            <div className="section-header">
              <h2><TrendingUp size={20} />Leaderboard</h2>
              <span className="section-badge">Top 10</span>
            </div>
            <Leaderboard data={leaderboard} currentUser={user?.username} />
          </motion.div>

          {/* Problem Filters */}
          <motion.div className="section-card" variants={itemVariants}>
            <div className="section-header">
              <h2><Filter size={20} />Filter Problems</h2>
            </div>
            <ProblemFilters 
              problems={problems}
              onFilter={handleProblemFilter}
            />
          </motion.div>

          {/* Recent Activity */}
          <motion.div className="section-card" variants={itemVariants}>
            <div className="section-header">
              <h2><Clock size={20} />Recent Activity</h2>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon success">
                  <Trophy size={16} />
                </div>
                <div className="activity-content">
                  <p>Solved "Two Sum" problem</p>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon primary">
                  <Users size={16} />
                </div>
                <div className="activity-content">
                  <p>Added a new friend</p>
                  <span className="activity-time">1 day ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon accent">
                  <Flame size={16} />
                </div>
                <div className="activity-content">
                  <p>Maintained 7-day streak</p>
                  <span className="activity-time">3 days ago</span>
                </div>
              </div>
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
    </motion.div>
  );
};

export default Dashboard;
