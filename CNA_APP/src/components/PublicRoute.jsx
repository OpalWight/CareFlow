import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/learner-home-final" />;
  }

  return children;
};

export default PublicRoute;
