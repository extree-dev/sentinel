import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authData = {
    token: localStorage.getItem('discord_token'),
    isAuthenticated: localStorage.getItem('isAuthenticated') === 'true'
  };
  
  console.log('ProtectedRoute check:', authData); // Логируем состояние
  
  return authData.token && authData.isAuthenticated 
    ? <>{children}</> 
    : <Navigate to="/" replace />;
}