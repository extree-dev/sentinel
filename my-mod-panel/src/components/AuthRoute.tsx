import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
  
    if (loading) return <div>Loading...</div>;
    return user ? <>{children}</> : <Navigate to="/login" replace />;
  }