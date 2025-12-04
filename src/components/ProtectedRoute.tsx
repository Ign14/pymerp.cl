import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, UserStatus } from '../types';
import { env } from '../config/env';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireActive?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireActive = true,
}) => {
  const { firebaseUser, firestoreUser, loading } = useAuth();

  if (env.app.environment === 'e2e') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!firebaseUser || !firestoreUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireActive && firestoreUser.status === UserStatus.FORCE_PASSWORD_CHANGE) {
    return <Navigate to="/change-password" replace />;
  }

  if (requiredRole && firestoreUser.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
