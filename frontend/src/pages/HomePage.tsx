import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function HomePage() {
  const { user } = useAuthStore();
  if (user?.role === 'HR') return <Navigate to="/hr/pipeline" replace />;
  if (user?.role === 'EVALUATOR') return <Navigate to="/eval" replace />;
  return <Navigate to="/jobs" replace />;
}
