import { useState, useEffect, useCallback } from 'react';

// Mock types formerly from @supabase/supabase-js
export interface User {
  id: string;
  email?: string;
  user_metadata: any;
}

export interface Session {
  user: User;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock user for pure Next.js demonstration
    const mockUser: User = {
      id: 'demo-user-id',
      email: 'demo@example.com',
      user_metadata: { display_name: 'Demo Person' }
    };
    
    // For now, let's start with a null user to simulate a logged-out state
    setLoading(false);
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    console.log('Mock sign up attempt:', { email, displayName });
    return { data: { user: null }, error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('Mock sign in attempt:', { email });
    return { data: { user: null }, error: null };
  }, []);

  const signOut = useCallback(async () => {
    console.log('Mock sign out');
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    console.log('Mock reset password:', email);
    return { data: {}, error: null };
  }, []);

  return { user, session, loading, signUp, signIn, signOut, resetPassword };
}
