import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
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

    // Check if there are auth tokens in the URL hash (from OAuth redirect on mobile)
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
      console.log('Auth tokens detected in URL hash, processing...');
      // Parse tokens from hash
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
          // Clean the URL hash
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        });
      } else {
        // THEN check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        });
      }
    } else {
      // THEN check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // Use full origin URL for mobile compatibility
    const redirectUrl = window.location.origin + '/';
    console.log('Starting Google OAuth with redirect:', redirectUrl);
    
    const { error, redirected } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: redirectUrl,
    });
    
    if (error) {
      console.error('OAuth error:', error);
      throw error;
    }
    
    // If redirected is false and no error, the popup might have been blocked
    if (!redirected && !error) {
      console.warn('OAuth may have been blocked by popup blocker');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
