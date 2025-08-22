import React from 'react';
import { Moon, Sun, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
  };

  const handleThemeToggle = () => {
    toggleTheme();
    toast.success(`Switched to ${isDark ? 'light' : 'dark'} mode`);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>🧠 BrainJar</h2>
        </div>
        
        <div className="navbar-menu">
          <div className="navbar-user">
            <User size={18} />
            <span>Welcome, {user?.username}!</span>
          </div>
          
          <button 
            onClick={handleThemeToggle} 
            className="theme-toggle"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
