import { Navigate } from 'react-router-dom';

interface AuthRouteProps {
    children: React.ReactNode;
}

export default function AuthRoute({ children }: AuthRouteProps) {
    const accessToken = localStorage.getItem('discord_access_token');
    
    if (!accessToken) {
        return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
}