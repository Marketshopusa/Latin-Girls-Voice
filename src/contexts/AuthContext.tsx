import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { clearPersistedAuthArtifacts, hasPendingAuthCallback, restorePersistedSession } from './auth/sessionPersistence';
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const isCapacitor = Capacitor.isNativePlatform();

// For Capacitor native builds, OAuth must redirect to the custom deep-link
// scheme so Android routes the callback back into the app via intent-filter.
const NATIVE_REDIRECT = 'com.syntheticdigitallabs.latingirlsvoice://google-auth';

const getWebOAuthRedirectUrl = () => {
  const url = new URL(window.location.href);
  url.hash = '';
  ['code', 'type', 'error', 'error_code', 'error_description'].forEach((key) => {
    url.searchParams.delete(key);
  });

  return `${url.origin}${url.pathname}${url.search}`;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);
  const latestSessionRef = useRef<Session | null>(null);

  const applySessionState = (nextSession: Session | null) => {
    latestSessionRef.current = nextSession;
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        const pendingCallback = hasPendingAuthCallback();

        if (pendingCallback) {
          setIsLoading(true);
        }

        const restoredSession = await restorePersistedSession();
        if (!isMounted) return;

        hasInitialized.current = true;
        applySessionState(restoredSession ?? latestSessionRef.current ?? null);

        const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);

          if (!isMounted) return;

          applySessionState(session);
        });

        subscription = authSubscription.data.subscription;
      } catch (error) {
        console.error('[Auth] Failed to restore session:', error);

        if (!isMounted) return;

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        hasInitialized.current = true;
        applySessionState(currentSession ?? latestSessionRef.current ?? null);

        const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);

          if (!isMounted) return;

          applySessionState(session);
        });

        subscription = authSubscription.data.subscription;
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (isCapacitor) {
      console.log('[Auth] Capacitor detected — requesting Google OAuth URL');

      const oauthResult = await Promise.race([
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: NATIVE_REDIRECT,
            skipBrowserRedirect: true,
            queryParams: {
              prompt: 'select_account',
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout obteniendo URL OAuth')), 12000)
        ),
      ]);

      const { data, error } = oauthResult as Awaited<
        ReturnType<typeof supabase.auth.signInWithOAuth>
      >;

      if (error) {
        console.error('[Auth] OAuth URL error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('[Auth] Google OAuth no devolvió URL de redirección');
      }

      console.log('[Auth] Opening OAuth URL in system browser:', data.url.substring(0, 80) + '...');
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: data.url });
      } catch (browserErr) {
        console.error('[Auth] Browser plugin failed, fallback to window.open:', browserErr);
        const popup = window.open(data.url, '_blank');
        if (!popup) {
          window.location.href = data.url;
        }
      }
      return;
    }

    // Web: use Lovable Cloud managed OAuth (handles credentials automatically)
    console.log('Starting Google OAuth (web) via Lovable Cloud Auth');

    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
      extraParams: {
        prompt: 'select_account',
      },
    });

    if (error) {
      console.error('OAuth error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // If email confirmation is required, data.user will exist but session may be null
    if (data.user && !data.session) {
      return { needsConfirmation: true };
    }
    return { needsConfirmation: false };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    clearPersistedAuthArtifacts();
    try {
      const keysToRemove = Object.keys(localStorage).filter(
        (key) => key.startsWith('sb-') || key.startsWith('supabase.')
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
