'use client';

import { useAuth } from '@/contexts/AuthContext';
import PinLockScreen from '@/components/PinLockScreen';

export default function LockGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <PinLockScreen />;
  return <>{children}</>;
}
