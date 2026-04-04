'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/screens/LandingPage';

export default function Page() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
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

  return (
    <LandingPage
      isAuthenticated={Boolean(user)}
      userName={user?.name ?? user?.email ?? undefined}
      onOpenDashboard={() => router.push('/dashboard')}
      onSignOut={signOut}
    />
  );
}
