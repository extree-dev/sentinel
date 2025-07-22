import { type ReactNode } from 'react'; // ✅ Явный type-only импорт
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const isAuthenticated = Boolean(localStorage.getItem('isAuthenticated'));
    
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
}