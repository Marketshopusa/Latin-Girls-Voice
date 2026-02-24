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

const isCapacitor = !!(window as any).Capacitor;

// The published URL is used as the OAuth redirect target for Capacitor.
// After auth, the broker redirects here, and Capacitor's allowNavigation
// lets us capture the tokens within the WebView.
const PUBLISHED_URL = 'https://persona-virtual-chat.lovable.app';

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
    // For Capacitor (local files), redirect to the published URL
    // so the OAuth broker can redirect back to a valid web URL,
    // which Capacitor's allowNavigation will intercept in the WebView.
    const redirectUrl = isCapacitor ? PUBLISHED_URL : window.location.origin;
    
    console.log('Starting Google OAuth — redirect:', redirectUrl, '| Capacitor:', isCapacitor);

    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: redirectUrl,
      } as any);
      
      console.log('OAuth result:', { 
        error: result.error?.message, 
        redirected: (result as any).redirected,
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
    <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
