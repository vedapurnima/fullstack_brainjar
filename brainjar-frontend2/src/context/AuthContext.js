import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// Custom event system for auth state changes (more reliable than state-based listeners)
const AUTH_EVENTS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  REGISTER: 'auth:register'
};

const authEventDispatcher = new EventTarget();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to add auth event listeners
export const addAuthEventListener = (eventType, callback) => {
  authEventDispatcher.addEventListener(eventType, callback);
  return () => authEventDispatcher.removeEventListener(eventType, callback);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Helper function to dispatch auth events
  const dispatchAuthEvent = (eventType, userData = null) => {
    const event = new CustomEvent(eventType, { 
      detail: { user: userData, timestamp: Date.now() } 
    });
    authEventDispatcher.dispatchEvent(event);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log('Auth restored for user:', parsedUser.username);
          } else {
            throw new Error('Invalid user data');
          }
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError);
          // Clear corrupted data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear any invalid auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      if (!token || !userData || !userData.id) {
        throw new Error('Invalid response from server');
      }
      
      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('Login successful for user:', userData.username);
      
      // Dispatch login event AFTER state is updated
      setTimeout(() => {
        dispatchAuthEvent(AUTH_EVENTS.LOGIN, userData);
      }, 100);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      
      // Ensure we don't have partial auth state on failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/signup', { username, email, password });
      const { token, user: userData } = response.data;
      
      if (!token || !userData || !userData.id) {
        throw new Error('Invalid response from server');
      }
      
      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('Registration successful for user:', userData.username);
      
      // Dispatch register event AFTER state is updated
      setTimeout(() => {
        dispatchAuthEvent(AUTH_EVENTS.REGISTER, userData);
      }, 100);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Ensure we don't have partial auth state on failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Registration failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      const currentUser = user;
      
      console.log('Logging out user:', currentUser?.username);
      
      // Clear storage first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      
      // Dispatch logout event AFTER clearing state
      dispatchAuthEvent(AUTH_EVENTS.LOGOUT, currentUser);
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear state even if there's an error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export auth events for use in components
export { AUTH_EVENTS };
