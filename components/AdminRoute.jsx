import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';

export default function AdminRoute({ children }) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}