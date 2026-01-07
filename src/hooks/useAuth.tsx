import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

    // Check if we've already processed this OAuth callback
    const hasProcessedOAuth = sessionStorage.getItem('oauth_processed');
    if (window.location.hash.includes('access_token') && hasProcessedOAuth === 'true') {
      console.log('OAuth already processed, cleaning hash and skipping');
      window.history.replaceState(null, '', window.location.pathname);
      sessionStorage.removeItem('oauth_processed');
    }

    let processed = false;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email);

        if (processed) {
          console.log('Already processed, skipping');
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('Fetching profile for user:', session.user.id);
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
        processed = true;

        // Clean up hash after OAuth callback
        if (event === 'SIGNED_IN' && window.location.hash) {
          console.log('Cleaning up URL hash');
          sessionStorage.setItem('oauth_processed', 'true');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    // Get existing session
    console.log('Checking for existing session...');
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('🔐 getSession result:', {
          hasSession: !!session,
          error: error?.message,
          user: session?.user?.email
        });

        if (!processed && !session) {
          console.log('No session found, setting loading false');
          setLoading(false);
        } else if (!processed && session) {
          console.log('Session found, setting user and fetching profile');
          setSession(session);
          setUser(session.user);
          fetchProfile(session.user.id).then(() => setLoading(false));
          processed = true;
        }
      })
      .catch(err => {
        console.error('getSession error:', err);
        if (!processed) {
          setLoading(false);
        }
      });

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
