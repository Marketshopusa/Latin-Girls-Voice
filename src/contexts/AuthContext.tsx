import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
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
const NATIVE_REDIRECT = 'com.marketshopusa.latingirlsvoice://google-auth';

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

    // Check for tokens from Capacitor deep link handler
    const capAccessToken = sessionStorage.getItem('__cap_oauth_access_token');
    const capRefreshToken = sessionStorage.getItem('__cap_oauth_refresh_token');
    const capCode = sessionStorage.getItem('__cap_oauth_code');

    if (capAccessToken && capRefreshToken) {
      console.log('[Auth] Restoring session from Capacitor deep link tokens');
      sessionStorage.removeItem('__cap_oauth_access_token');
      sessionStorage.removeItem('__cap_oauth_refresh_token');
      supabase.auth.setSession({
        access_token: capAccessToken,
        refresh_token: capRefreshToken,
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error setting session from deep link:', error);
        } else {
          console.log('Session restored from deep link successfully');
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
        setIsLoading(false);
      });
    } else if (capCode) {
      console.log('[Auth] Auth code from Capacitor deep link, exchanging...');
      sessionStorage.removeItem('__cap_oauth_code');
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        });
      }, 1000);
    } else {
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
        console.log('Auth code detected in URL query, letting process...');
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
            window.history.replaceState(null, '', window.location.pathname);
          });
        }, 1000);
      } else {
        // No tokens — check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        });
      }
    }

    return () => subscription.unsubscribe();
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

    // For web: standard OAuth redirect back to current origin
    const redirectUrl = window.location.origin;
    console.log('Starting Google OAuth (web) — redirect:', redirectUrl);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account',
        },
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

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Clear all stale session data from localStorage
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
    <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
