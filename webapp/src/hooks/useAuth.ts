import { useState, useEffect, useCallback } from 'react';
import { getSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { API_ROUTES } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const currentSession = await getSession();

      if (!active) {
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    };

    void syncSession();

    return () => {
      active = false;
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const username = displayName?.trim() || email.split('@')[0] || email;

    const response = await fetch(API_ROUTES.register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        username,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        data: { user: null },
        error: new Error(payload.error || 'Signup failed'),
      };
    }

    const signInResult = await nextAuthSignIn('credentials', {
      redirect: false,
      email,
      password,
    });

    const currentSession = await getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);

    return {
      data: { user: currentSession?.user ?? null },
      error: signInResult?.error ? new Error(signInResult.error) : null,
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await nextAuthSignIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      return { data: { user: null }, error: new Error(result.error) };
    }

    const currentSession = await getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);

    return { data: { user: currentSession?.user ?? null }, error: null };
  }, []);

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ redirect: false });
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (_email: string) => {
    return {
      data: {},
      error: new Error('Password reset is not configured yet.'),
    };
  }, []);

  return { user, session, loading, signUp, signIn, signOut, resetPassword };
}
