import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/database.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, redirectPath?: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const latestUserIdRef = useRef<string | null>(null);

  const clearAuthState = () => {
    latestUserIdRef.current = null;
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const setAuthState = (nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null;
    latestUserIdRef.current = nextUser?.id ?? null;
    setSession(nextSession);
    setUser(nextUser);
  };

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        if (latestUserIdRef.current === userId) {
          setProfile(null);
        }
        return null;
      }

      if (latestUserIdRef.current !== userId) {
        return null;
      }

      setProfile(data ?? null);
      return data ?? null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (latestUserIdRef.current === userId) {
        setProfile(null);
      }
      return null;
    }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Check for OAuth hash and wait for Supabase to process it
    const hasOAuthHash = window.location.hash.includes('access_token');

    if (hasOAuthHash) {
      console.log('OAuth callback detected, waiting for Supabase to process...');
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        if (!mounted) return;

        try {
          setAuthState(session);

          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setProfile(null);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }

        // Clean up URL hash after successful sign in
        if (event === 'SIGNED_IN' && window.location.hash) {
          console.log('Cleaning up OAuth hash from URL');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    // Initialize session - delay slightly if OAuth hash present to let Supabase process it
    const initSession = async () => {
      // If OAuth hash is present, wait a bit for Supabase to process it
      if (hasOAuthHash) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      let session: Session | null = null;
      let error: Error | null = null;

      try {
        const result = await supabase.auth.getSession();
        session = result.data.session;
        error = result.error;
      } catch (err) {
        error = err as Error;
      }

      console.log('Initial session check:', session?.user?.id, error);

      if (!mounted) return;

      if (error) {
        console.error('Session initialization error:', error);
        clearAuthState();
        if (mounted) setLoading(false);
        return;
      }

      try {
        setAuthState(session);

        if (session?.user) {
          await fetchProfile(session.user.id);

          // Failsafe: Clean up hash if Supabase didn't do it
          if (window.location.hash.includes('access_token')) {
            console.log('Manually cleaning up OAuth hash (failsafe)');
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        clearAuthState();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithEmail(email: string, redirectPath?: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectPath || window.location.pathname}`,
      },
    });
    return { error };
  }

  async function signInWithGoogle(redirectPath?: string) {
    const redirectUrl = `${window.location.origin}${redirectPath || '/'}`;
    console.log('Google sign in - redirect URL:', redirectUrl);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    console.log('Google OAuth response:', { error });
    return { error };
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      clearAuthState();
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
