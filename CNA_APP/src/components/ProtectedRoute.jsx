import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signup" />;
  }

  return children;
};

export default ProtectedRoute;
