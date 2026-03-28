import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const CAP_ACCESS_TOKEN_KEY = '__cap_oauth_access_token';
const CAP_REFRESH_TOKEN_KEY = '__cap_oauth_refresh_token';
const CAP_CODE_KEY = '__cap_oauth_code';
const AUTH_CALLBACK_TIMEOUT_MS = 8000;
const AUTH_CALLBACK_POLL_MS = 250;

const clearStoredNativeAuth = () => {
  sessionStorage.removeItem(CAP_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(CAP_REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(CAP_CODE_KEY);
};

const cleanAuthUrl = () => {
  const url = new URL(window.location.href);

  url.hash = '';
  ['code', 'type', 'error', 'error_code', 'error_description'].forEach((key) => {
    url.searchParams.delete(key);
  });

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(null, '', nextUrl || '/');
};

const getExistingSession = async (): Promise<Session | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

const getBrowserAuthCallbackState = () => {
  if (typeof window === 'undefined') {
    return {
      authCode: null,
      hasAuthError: false,
      hasTokensInHash: false,
      isAuthReturn: false,
    };
  }

  const hash = window.location.hash;
  const searchParams = new URLSearchParams(window.location.search);
  const hasTokensInHash = hash.includes('access_token') || hash.includes('refresh_token');
  const authCode = searchParams.get('code');
  const hasAuthError = searchParams.has('error') || hash.includes('error=');

  return {
    authCode,
    hasAuthError,
    hasTokensInHash,
    isAuthReturn: hasTokensInHash || Boolean(authCode) || hasAuthError,
  };
};

export const hasPendingAuthCallback = () => {
  return getBrowserAuthCallbackState().isAuthReturn;
};

const isRecoverableExchangeError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return [
    'auth code and code verifier should be non-empty',
    'code verifier',
    'invalid flow state',
    'already been used',
    'flow state not found',
  ].some((fragment) => message.includes(fragment));
};

const restoreNativeSession = async (): Promise<Session | null> => {
  const accessToken = sessionStorage.getItem(CAP_ACCESS_TOKEN_KEY);
  const refreshToken = sessionStorage.getItem(CAP_REFRESH_TOKEN_KEY);
  const authCode = sessionStorage.getItem(CAP_CODE_KEY);

  if (accessToken && refreshToken) {
    clearStoredNativeAuth();
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) throw error;
    return data.session;
  }

  if (authCode) {
    clearStoredNativeAuth();
    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      const fallbackSession = await getExistingSession();
      if (fallbackSession || isRecoverableExchangeError(error)) return fallbackSession;
      throw error;
    }

    return data.session;
  }

  return null;
};

const waitForBrowserSession = async (): Promise<Session | null> => {
  const existingSession = await getExistingSession();
  if (existingSession) return existingSession;

  return await new Promise<Session | null>((resolve) => {
    let settled = false;

    const cleanup = (
      subscription?: { unsubscribe: () => void },
      intervalId?: number,
      timeoutId?: number,
    ) => {
      subscription?.unsubscribe();
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };

    const settle = (
      session: Session | null,
      subscription?: { unsubscribe: () => void },
      intervalId?: number,
      timeoutId?: number,
    ) => {
      if (settled) return;
      settled = true;
      cleanup(subscription, intervalId, timeoutId);
      resolve(session);
    };

    const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')
      ) {
        settle(session, authSubscription.data.subscription, intervalId, timeoutId);
      }
    });

    const intervalId = window.setInterval(async () => {
      const session = await getExistingSession();
      if (session) {
        settle(session, authSubscription.data.subscription, intervalId, timeoutId);
      }
    }, AUTH_CALLBACK_POLL_MS);

    const timeoutId = window.setTimeout(async () => {
      const session = await getExistingSession();
      settle(session, authSubscription.data.subscription, intervalId, timeoutId);
    }, AUTH_CALLBACK_TIMEOUT_MS);
  });
};

const restoreBrowserSession = async (): Promise<Session | null> => {
  const { authCode, hasAuthError, hasTokensInHash, isAuthReturn } = getBrowserAuthCallbackState();

  if (!isAuthReturn) {
    return getExistingSession();
  }

  if (hasTokensInHash) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      cleanAuthUrl();
      if (error) throw error;
      return data.session;
    }
  }

  if (hasAuthError) {
    cleanAuthUrl();
    return getExistingSession();
  }

  if (authCode) {
    const restoredSession = await waitForBrowserSession();
    cleanAuthUrl();
    return restoredSession;
  }

  return getExistingSession();
};

export const restorePersistedSession = async () => {
  return (await restoreNativeSession()) ?? restoreBrowserSession();
};

export const clearPersistedAuthArtifacts = () => {
  clearStoredNativeAuth();
  cleanAuthUrl();
};