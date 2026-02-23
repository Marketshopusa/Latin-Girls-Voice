import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Check if there are auth tokens in the URL hash (from OAuth redirect)
    const hash = window.location.hash;
    const search = window.location.search;
    const hasTokensInHash = hash && (hash.includes('access_token') || hash.includes('refresh_token'));
    const hasCodeInQuery = search && search.includes('code=');

    if (hasTokensInHash) {
      console.log('Auth tokens detected in URL hash, processing...');
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ data, error }) => {
          if (error) {
            console.error('Error setting session from URL tokens:', error);
          } else {
            console.log('Session set from URL tokens successfully');
            setSession(data.session);
            setUser(data.session?.user ?? null);
          }
          setIsLoading(false);
          // Clean the URL
          window.history.replaceState(null, '', window.location.pathname);
        });
      } else {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        });
      }
    } else if (hasCodeInQuery) {
      // Authorization code flow — Supabase client handles exchange automatically
      console.log('Auth code detected in URL query, letting Supabase process...');
      // Give the Supabase client time to exchange the code for tokens
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log('Session after code exchange:', session?.user?.email ?? 'none');
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
          window.history.replaceState(null, '', window.location.pathname);
        });
      }, 1000);
    } else {
      // No tokens in URL — check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = window.location.origin;
    const isCapacitor = !!(window as any).Capacitor;
    console.log('Starting Google OAuth — redirect:', redirectUrl, '| Capacitor:', isCapacitor);

    try {
      // In Capacitor, ensure SWs are fully removed before redirect
      // (belt-and-suspenders with main.tsx unregistration)
      if (isCapacitor && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
          console.log('[Capacitor] Pre-OAuth SW unregistered:', reg.scope);
        }
      }

      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: redirectUrl,
      } as any);
      
      console.log('OAuth result:', { 
        error: result.error?.message, 
        redirected: (result as any).redirected,
        hasTokens: !!(result as any).tokens 
      });
      
      if (result.error) {
        console.error('OAuth error:', result.error);
        throw result.error;
      }
    } catch (error) {
      console.error('OAuth exception:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
      } else {
        throw error;
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Clear any stale session data from localStorage to prevent token conflicts
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
    <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
