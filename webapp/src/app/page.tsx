'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/screens/LandingPage';
import Dashboard from '@/screens/Dashboard';

export default function Page() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show landing page if no user, dashboard if authenticated
  if (!user) {
    return <LandingPage />;
  }

  return <Dashboard />;
}
