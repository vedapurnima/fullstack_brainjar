import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiOutlineMoon, 
  HiOutlineSun, 
  HiOutlineUser, 
  HiOutlineArrowLeftEndOnRectangle, 
  HiOutlineHome,
  HiOutlinePuzzlePiece,
  HiOutlineCpuChip,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineChatBubbleLeftRight
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    setMobileMenuOpen(false);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    toast.success(`Switched to ${isDark ? 'light' : 'dark'} mode`);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-brand">
          <HiOutlineCpuChip className="brand-icon" />
          <span className="brand-text">BrainJar</span>
          <HiOutlineSparkles className="brand-accent" />
        </div>
        
        {/* Desktop Navigation */}
        <div className="navbar-nav desktop-nav">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <HiOutlineHome className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink 
            to="/enhanced-problems" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <HiOutlinePuzzlePiece className="nav-icon" />
            <span>Problems</span>
          </NavLink>
          <NavLink 
            to="/friends" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <HiOutlineUserGroup className="nav-icon" />
            <span>Friends</span>
          </NavLink>
          <NavLink 
            to="/chat" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <HiOutlineChatBubbleLeftRight className="nav-icon" />
            <span>Chat</span>
          </NavLink>
        </div>
        
        {/* Desktop Menu */}
        <div className="navbar-menu desktop-menu">
          <NavLink 
            to="/profile" 
            className="navbar-user"
            onClick={closeMobileMenu}
          >
            <div className="user-avatar">
              <HiOutlineUser />
            </div>
            <div className="user-info">
              <span className="user-greeting">Welcome back,</span>
              <span className="user-name">{user?.username}</span>
            </div>
          </NavLink>
          
          <button 
            onClick={handleThemeToggle} 
            className="theme-toggle"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <HiOutlineSun /> : <HiOutlineMoon />}
          </button>
          
          <button 
            onClick={handleLogout} 
            className="logout-btn"
            title="Logout"
          >
            <HiOutlineArrowLeftEndOnRectangle />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <HiOutlineXMark /> : <HiOutlineBars3 />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-content">
          <div className="mobile-user-section">
            <div className="mobile-user-avatar">
              <HiOutlineUser />
            </div>
            <div className="mobile-user-info">
              <span className="mobile-user-greeting">Welcome back,</span>
              <span className="mobile-user-name">{user?.username}</span>
            </div>
          </div>

          <div className="mobile-nav-links">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <HiOutlineHome className="mobile-nav-icon" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink 
              to="/enhanced-problems" 
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <HiOutlinePuzzlePiece className="mobile-nav-icon" />
              <span>Problems</span>
            </NavLink>
            <NavLink 
              to="/friends" 
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <HiOutlineUserGroup className="mobile-nav-icon" />
              <span>Friends</span>
            </NavLink>
            <NavLink 
              to="/chat" 
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <HiOutlineChatBubbleLeftRight className="mobile-nav-icon" />
              <span>Chat</span>
            </NavLink>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <HiOutlineUser className="mobile-nav-icon" />
              <span>Profile</span>
            </NavLink>
          </div>

          <div className="mobile-nav-actions">
            <button 
              onClick={handleThemeToggle} 
              className="mobile-action-btn"
            >
              {isDark ? <HiOutlineSun /> : <HiOutlineMoon />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button 
              onClick={handleLogout} 
              className="mobile-action-btn logout"
            >
              <HiOutlineArrowLeftEndOnRectangle />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={closeMobileMenu}
        />
      )}
    </nav>
  );
};

export default Navbar;
