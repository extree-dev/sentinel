// components/AuthRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AccessDenied from '../pages/AccessDenied';

interface AuthRouteProps {
  children: React.ReactNode;
  isVerificationPage?: boolean;
}

export default function AuthRoute({ children, isVerificationPage = false }: AuthRouteProps) {
  const { user, loading, hasAccess, isVerifier } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  console.log('Route protection check:', {
    path: location.pathname,
    hasAccess,
    isVerifier,
    isVerificationPage
  });

  // Если пользователь на странице верификации
  if (isVerificationPage) {
    if (isVerifier || hasAccess) {
      return <>{children}</>;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Если пользователь на dashboard или других защищенных страницах
  if (hasAccess) {
    return <>{children}</>;
  }

  // Если верификатор пытается попасть не на страницу верификации
  if (isVerifier) {
    return <Navigate to="/verification" replace />;
  }

  // Все остальные случаи - доступ запрещен
  return <AccessDenied />;
}