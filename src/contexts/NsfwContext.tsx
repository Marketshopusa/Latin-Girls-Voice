import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================================
// KILL SWITCH: Set to false to completely hide all NSFW features
// Toggle this to true when ready to re-enable NSFW content
// ============================================================
const NSFW_FEATURE_ENABLED = false;

interface NsfwContextType {
  nsfwEnabled: boolean;
  toggleNsfw: () => void;
  confirmAge: () => Promise<void>;
  hasConfirmedAge: boolean;
  /** Whether the NSFW feature is available at all (kill switch) */
  featureVisible: boolean;
}

const NsfwContext = createContext<NsfwContextType | undefined>(undefined);

export const NsfwProvider = ({ children }: { children: ReactNode }) => {
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [hasConfirmedAge, setHasConfirmedAge] = useState(false);

  // If kill switch is OFF, everything stays disabled — skip all checks
  useEffect(() => {
    if (!NSFW_FEATURE_ENABLED) return;

    const checkAgeVerification = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('user_age_verifications' as any)
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            setHasConfirmedAge(true);
            const stored = localStorage.getItem('nsfw_enabled');
            if (stored === 'true') {
              setNsfwEnabled(true);
            }
            return;
          }
        }

        const stored = localStorage.getItem('nsfw_enabled');
        const ageConfirmed = localStorage.getItem('age_confirmed');
        if (stored === 'true' && ageConfirmed === 'true') {
          setNsfwEnabled(true);
          setHasConfirmedAge(true);
        }
      } catch (err) {
        console.error('Error checking age verification:', err);
        const stored = localStorage.getItem('nsfw_enabled');
        const ageConfirmed = localStorage.getItem('age_confirmed');
        if (stored === 'true' && ageConfirmed === 'true') {
          setNsfwEnabled(true);
          setHasConfirmedAge(true);
        }
      }
    };

    checkAgeVerification();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAgeVerification();
    });

    return () => subscription.unsubscribe();
  }, []);

  const confirmAge = useCallback(async () => {
    if (!NSFW_FEATURE_ENABLED) return;
    setHasConfirmedAge(true);
    localStorage.setItem('age_confirmed', 'true');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_age_verifications' as any)
          .upsert(
            { user_id: user.id },
            { onConflict: 'user_id' }
          );
      }
    } catch (err) {
      console.error('Error storing age verification:', err);
    }
  }, []);

  const toggleNsfw = () => {
    if (!NSFW_FEATURE_ENABLED) return;
    const newValue = !nsfwEnabled;
    setNsfwEnabled(newValue);
    localStorage.setItem('nsfw_enabled', String(newValue));
  };

  return (
    <NsfwContext.Provider value={{
      nsfwEnabled: NSFW_FEATURE_ENABLED ? nsfwEnabled : false,
      toggleNsfw,
      confirmAge,
      hasConfirmedAge: NSFW_FEATURE_ENABLED ? hasConfirmedAge : false,
      featureVisible: NSFW_FEATURE_ENABLED,
    }}>
      {children}
    </NsfwContext.Provider>
  );
};

export const useNsfw = () => {
  const context = useContext(NsfwContext);
  if (!context) {
    throw new Error('useNsfw must be used within NsfwProvider');
  }
  return context;
};
