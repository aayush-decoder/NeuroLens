import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_language: string;
  daily_goal_minutes: number;
  reading_goal_minutes?: number;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const storageKey = `adaptive-reader:profile:${user.id}`;

    const mockProfile: Profile = {
      id: `${user.id}-profile`,
      user_id: user.id,
      display_name: user.name || 'User',
      avatar_url: null,
      preferred_language: 'en',
      daily_goal_minutes: 30,
    };

    const storedProfile = localStorage.getItem(storageKey);
    if (storedProfile) {
      try {
        const parsedProfile = JSON.parse(storedProfile) as Profile;
        setProfile({
          ...mockProfile,
          ...parsedProfile,
          user_id: user.id,
          daily_goal_minutes: parsedProfile.daily_goal_minutes ?? parsedProfile.reading_goal_minutes ?? 30,
        });
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    setProfile(mockProfile);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;

    const storageKey = `adaptive-reader:profile:${user.id}`;
    const nextProfile: Profile = {
      id: profile?.id || `${user.id}-profile`,
      user_id: user.id,
      display_name: updates.display_name ?? profile?.display_name ?? user.name ?? 'User',
      avatar_url: updates.avatar_url ?? profile?.avatar_url ?? null,
      preferred_language: updates.preferred_language ?? profile?.preferred_language ?? 'en',
      daily_goal_minutes: updates.daily_goal_minutes ?? profile?.daily_goal_minutes ?? profile?.reading_goal_minutes ?? 30,
      reading_goal_minutes: updates.daily_goal_minutes ?? updates.reading_goal_minutes ?? profile?.reading_goal_minutes ?? profile?.daily_goal_minutes ?? 30,
    };

    setProfile(nextProfile);
    localStorage.setItem(storageKey, JSON.stringify(nextProfile));
    return { error: null };
  }, [profile, user]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
