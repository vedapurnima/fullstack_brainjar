import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css';

// Private Route component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// App Layout
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="app">
      {isAuthenticated && <Navbar />}
      <main className="main-content">
        {children}
      </main>
      {isAuthenticated && <Chatbot />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </div>
  );
};

// Main App Routes
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
