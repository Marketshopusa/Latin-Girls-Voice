import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const CAP_ACCESS_TOKEN_KEY = '__cap_oauth_access_token';
const CAP_REFRESH_TOKEN_KEY = '__cap_oauth_refresh_token';
const CAP_CODE_KEY = '__cap_oauth_code';

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
    if (error) throw error;
    return data.session;
  }

  return null;
};

const restoreBrowserSession = async (): Promise<Session | null> => {
  const hash = window.location.hash;
  const search = window.location.search;
  const hasTokensInHash = hash.includes('access_token') || hash.includes('refresh_token');
  const authCode = new URLSearchParams(search).get('code');

  if (hasTokensInHash) {
    const params = new URLSearchParams(hash.slice(1));
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

  if (authCode) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);
    cleanAuthUrl();
    if (error) throw error;
    return data.session;
  }

  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const restorePersistedSession = async () => {
  return (await restoreNativeSession()) ?? restoreBrowserSession();
};

export const clearPersistedAuthArtifacts = () => {
  clearStoredNativeAuth();
  cleanAuthUrl();
};