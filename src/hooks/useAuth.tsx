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
    // Debug logging
    console.log('=== Auth Provider Initializing ===');
    console.log('Current URL:', window.location.href);
    console.log('URL Hash:', window.location.hash);
    console.log('URL Search:', window.location.search);

    // Listen for auth changes first (this will catch OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);

        // Clean up URL hash after successful auth
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
          console.log('Cleaning up URL hash');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    // Check if we're coming back from OAuth with tokens in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      console.log('Found OAuth tokens in URL, setting session...');
      // Manually set the session from URL tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        console.log('setSession result:', { session: !!data.session, error, user: data.session?.user?.email });
        if (error) {
          console.error('Error setting session:', error);
          setLoading(false);
        }
        // onAuthStateChange will handle the rest
      });
    } else {
      // No OAuth callback, get existing session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log('getSession result:', { session: !!session, error, user: session?.user?.email });

        // Only set if we don't have a session yet (onAuthStateChange might have fired first)
        if (!session) {
          setLoading(false);
        } else {
          setSession(session);
          setUser(session.user);
          fetchProfile(session.user.id).then(() => setLoading(false));
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
