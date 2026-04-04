'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/screens/AuthPage';
import Dashboard from '@/screens/Dashboard';

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const DEV_BYPASS_AUTH = true; // Temporary development flag

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show auth page if no user and not bypassing auth
  if (!user && !DEV_BYPASS_AUTH) {
    return <AuthPage />;
  }

  // Show dashboard for authenticated users or in dev mode
  return <Dashboard />;
}
