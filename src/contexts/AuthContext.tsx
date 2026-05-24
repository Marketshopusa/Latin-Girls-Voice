import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { clearPersistedAuthArtifacts, restorePersistedSession } from './auth/sessionPersistence';

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

const NATIVE_REDIRECT = 'com.syntheticdigitallabs.latingirlsvoice://google-auth';
const WEB_OAUTH_CALLBACK_PATH = '/auth/callback';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getFriendlyAuthError = (error: { message?: string; code?: string }) => {
  const rawMessage = error.message || '';
  const message = rawMessage.toLowerCase();
  if (error.code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return new Error('Correo o contraseña incorrectos. Si ya registraste este correo, usa “Recuperar contraseña” para crear una nueva clave.');
  }
  if (message.includes('user already registered') || message.includes('already registered')) {
    return new Error('Este correo ya está registrado. Inicia sesión o usa “Recuperar contraseña” si no recuerdas la clave.');
  }
  if (message.includes('email not confirmed')) {
    return new Error('Tu correo todavía no está confirmado. Solicita un nuevo enlace o usa “Recuperar contraseña”.');
  }
  return new Error(rawMessage || 'No pudimos completar el acceso. Inténtalo de nuevo.');
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySessionState = (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    let hasAuthEvent = false;

    const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      hasAuthEvent = true;
      if (!isMounted) return;
      applySessionState(session);
    });

    const subscription = authSubscription.data.subscription;

    const initializeAuth = async () => {
      try {
        const currentSession = await restorePersistedSession();
        if (!isMounted || hasAuthEvent) return;
        applySessionState(currentSession ?? null);
      } catch (error) {
        console.error('[Auth] Failed to restore session:', error);
        if (!isMounted) return;
        applySessionState(null);
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
            queryParams: { prompt: 'select_account' },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout obteniendo URL OAuth')), 12000)
        ),
      ]);

      const { data, error } = oauthResult as Awaited<
        ReturnType<typeof supabase.auth.signInWithOAuth>
      >;

      if (error) { console.error('[Auth] OAuth URL error:', error); throw error; }
      if (!data?.url) { throw new Error('[Auth] Google OAuth no devolvió URL de redirección'); }

      console.log('[Auth] Opening OAuth URL in system browser:', data.url.substring(0, 80) + '...');
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: data.url });
      } catch (browserErr) {
        console.error('[Auth] Browser plugin failed, fallback to window.open:', browserErr);
        const popup = window.open(data.url, '_blank');
        if (!popup) { window.location.href = data.url; }
      }
      return;
    }

    const redirectTo = new URL(WEB_OAUTH_CALLBACK_PATH, window.location.origin).toString();
    console.log('[Auth] Starting Google OAuth (web) with direct callback:', redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('[Auth] OAuth error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password });
    if (error) throw getFriendlyAuthError(error);
    if (data.session) applySessionState(data.session);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const cleanEmail = normalizeEmail(email);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw getFriendlyAuthError(error);
    if (data.user?.identities && data.user.identities.length === 0) {
      throw new Error('Este correo ya está registrado. Inicia sesión o usa “Recuperar contraseña” si no recuerdas la clave.');
    }
    if (data.session) {
      applySessionState(data.session);
      return { needsConfirmation: false };
    }

    const loginResult = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (!loginResult.error && loginResult.data.session) {
      applySessionState(loginResult.data.session);
      return { needsConfirmation: false };
    }

    if (data.user && !data.session) {
      return { needsConfirmation: true };
    }
    return { needsConfirmation: false };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw getFriendlyAuthError(error);
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
