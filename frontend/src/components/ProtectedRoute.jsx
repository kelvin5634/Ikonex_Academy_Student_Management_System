import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-brand-700">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
