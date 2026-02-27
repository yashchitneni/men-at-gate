import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/database.types';

const AUTH_QUERY_PARAMS = ['code', 'state', 'error', 'error_code', 'error_description'];
const AUTH_HASH_PARAMS = [
  'access_token',
  'refresh_token',
  'expires_in',
  'expires_at',
  'token_type',
  'provider_token',
];

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

function getAuthRedirectPath(redirectPath?: string) {
  if (!redirectPath) {
    return `${window.location.pathname}${window.location.search}`;
  }

  if (redirectPath.startsWith('/')) {
    return redirectPath;
  }

  return `/${redirectPath}`;
}

function getAuthRedirectUrl(redirectPath?: string) {
  return `${window.location.origin}${getAuthRedirectPath(redirectPath)}`;
}

function hasOAuthHashTokens() {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return false;

  const params = new URLSearchParams(hash);
  return AUTH_HASH_PARAMS.some((key) => params.has(key));
}

function hasOAuthQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return AUTH_QUERY_PARAMS.some((key) => params.has(key));
}

function cleanupAuthUrl() {
  const url = new URL(window.location.href);
  let changed = false;

  AUTH_QUERY_PARAMS.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });

  if (url.hash) {
    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash);
    const hasAuthHash = AUTH_HASH_PARAMS.some((key) => hashParams.has(key));

    if (hasAuthHash) {
      url.hash = '';
      changed = true;
    }
  }

  if (changed) {
    const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, '', cleanUrl);
  }
}

async function resolveSessionFromOAuthCallback() {
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get('code');

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
    if (error) throw error;
    return data.session;
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;

  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (!accessToken || !refreshToken) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
  return data.session;
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        console.log('Auth state changed:', event, nextSession?.user?.id);

        if (!mounted) return;

        try {
          setAuthState(nextSession);

          if (nextSession?.user) {
            await fetchProfile(nextSession.user.id);
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

        if (event === 'SIGNED_IN' && (hasOAuthHashTokens() || hasOAuthQueryParams())) {
          cleanupAuthUrl();
        }
      }
    );

    const initSession = async () => {
      let currentSession: Session | null = null;

      try {
        if (hasOAuthHashTokens() || hasOAuthQueryParams()) {
          currentSession = await resolveSessionFromOAuthCallback();
        }
      } catch (error) {
        console.error('OAuth callback session exchange failed:', error);
      }

      if (!currentSession) {
        let sessionError: Error | null = null;

        try {
          const result = await supabase.auth.getSession();
          currentSession = result.data.session;
          sessionError = result.error;
        } catch (error) {
          sessionError = error as Error;
        }

        if (sessionError) {
          console.error('Session initialization error:', sessionError);
          if (!mounted) return;
          clearAuthState();
          if (mounted) setLoading(false);
          return;
        }
      }

      if (!mounted) return;

      try {
        setAuthState(currentSession);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }

        if (hasOAuthHashTokens() || hasOAuthQueryParams()) {
          cleanupAuthUrl();
        }
      } catch (error) {
        console.error('Session initialization error:', error);
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
        emailRedirectTo: getAuthRedirectUrl(redirectPath),
      },
    });
    return { error };
  }

  async function signInWithGoogle(redirectPath?: string) {
    const redirectUrl = getAuthRedirectUrl(redirectPath);
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
