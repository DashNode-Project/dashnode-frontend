import { useAuth } from '@/features/auth/AuthContext';
import { AdminHomeDashboard } from './AdminHomeDashboard';
import { OperationalHomeDashboard } from './OperationalHomeDashboard';

export default function HomePage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'admin') {
    return <AdminHomeDashboard welcomeName={user.name} />;
  }
  return <OperationalHomeDashboard user={user} />;
}
