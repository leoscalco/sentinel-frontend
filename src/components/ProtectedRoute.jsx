import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-gray">
                <div className="text-brand-navy font-bold text-xl">Carregando...</div>
            </div>
        );
    }

    if (!user) {
        // Redirect them to the login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Require Onboarding (Specialties selection) if they haven't done it yet
    const hasSpecialties = user?.specialties && Array.isArray(user.specialties) && user.specialties.length > 0;
    
    if (!hasSpecialties && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    return children;
};

export default ProtectedRoute;
