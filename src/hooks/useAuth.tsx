import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/database.types';

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

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
    }
  }

  useEffect(() => {
    console.log('=== Auth Provider Initializing ===');
    console.log('Current URL:', window.location.href);
    console.log('URL Hash:', window.location.hash);

    let processed = false;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);

        if (processed) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
        processed = true;

        // Clean up URL hash after successful auth
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
          console.log('Cleaning up URL hash');
          setTimeout(() => {
            window.history.replaceState(null, '', window.location.pathname);
          }, 100);
        }
      }
    );

    // Check if we have tokens in hash - parse and set manually
    if (window.location.hash.includes('access_token')) {
      console.log('Found access_token in hash, parsing...');

      // Parse hash parameters
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('Setting session with tokens...');

        // Use refreshSession with the refresh token to establish session
        supabase.auth.refreshSession({ refresh_token: refreshToken })
          .then(({ data, error }) => {
            console.log('refreshSession result:', {
              hasSession: !!data.session,
              error: error?.message,
              user: data.session?.user?.email
            });
            if (error) {
              console.error('refreshSession error:', error);
              setLoading(false);
            }
          })
          .catch(err => {
            console.error('refreshSession exception:', err);
            setLoading(false);
          });
      }
    } else {
      // No OAuth callback, get existing session
      console.log('No OAuth hash, checking for existing session...');
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log('getSession result:', {
          hasSession: !!session,
          error: error?.message,
          user: session?.user?.email
        });

        if (!processed && !session) {
          setLoading(false);
        } else if (!processed && session) {
          setSession(session);
          setUser(session.user);
          fetchProfile(session.user.id).then(() => setLoading(false));
          processed = true;
        }
      });
    }

    return () => subscription.unsubscribe();
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
    const redirectUrl = `${window.location.origin}${redirectPath || window.location.pathname}`;
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
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
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
