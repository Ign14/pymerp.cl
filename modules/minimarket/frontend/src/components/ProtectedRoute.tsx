import { Navigate, useLocation } from 'react-router-dom';
import { getSession, getStoredToken } from '../auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const session = getSession();
  const token = getStoredToken();
  const isLoggedIn = Boolean(session || token);

  if (!isLoggedIn) {
    return <Navigate to="/minimarketerp_login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
