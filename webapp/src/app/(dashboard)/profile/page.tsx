'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfilePage from '@/screens/ProfilePage';
import { useAuth } from '@/hooks/useAuth';

export default function Page() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return null;
  }

  return <ProfilePage />;
}
