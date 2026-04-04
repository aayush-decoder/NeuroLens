import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  preferred_language: string;
  reading_goal_minutes: number;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    
    // Return mock profile
    const mockProfile: Profile = {
      id: 'mock-profile-id',
      user_id: user.id,
      display_name: (user as any).user_metadata?.display_name || 'User',
      avatar_url: null,
      bio: 'Just a demo user.',
      preferred_language: 'en',
      reading_goal_minutes: 30,
    };
    
    setProfile(mockProfile);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;
    console.log('Mock profile update:', updates);
    return { error: null };
  }, [user]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
