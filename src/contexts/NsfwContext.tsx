import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NsfwContextType {
  nsfwEnabled: boolean;
  toggleNsfw: () => void;
  confirmAge: () => Promise<void>;
  hasConfirmedAge: boolean;
}

const NsfwContext = createContext<NsfwContextType | undefined>(undefined);

export const NsfwProvider = ({ children }: { children: ReactNode }) => {
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [hasConfirmedAge, setHasConfirmedAge] = useState(false);

  // Check age verification from database on mount
  useEffect(() => {
    const checkAgeVerification = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check server-side age verification
          const { data } = await supabase
            .from('user_age_verifications' as any)
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            setHasConfirmedAge(true);
            // Restore NSFW toggle state from localStorage
            const stored = localStorage.getItem('nsfw_enabled');
            if (stored === 'true') {
              setNsfwEnabled(true);
            }
            return;
          }
        }

        // Fallback: check localStorage (for backward compatibility)
        const stored = localStorage.getItem('nsfw_enabled');
        const ageConfirmed = localStorage.getItem('age_confirmed');
        if (stored === 'true' && ageConfirmed === 'true') {
          setNsfwEnabled(true);
          setHasConfirmedAge(true);
        }
      } catch (err) {
        console.error('Error checking age verification:', err);
        // Fallback to localStorage
        const stored = localStorage.getItem('nsfw_enabled');
        const ageConfirmed = localStorage.getItem('age_confirmed');
        if (stored === 'true' && ageConfirmed === 'true') {
          setNsfwEnabled(true);
          setHasConfirmedAge(true);
        }
      }
    };

    checkAgeVerification();

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAgeVerification();
    });

    return () => subscription.unsubscribe();
  }, []);

  const confirmAge = useCallback(async () => {
    setHasConfirmedAge(true);
    localStorage.setItem('age_confirmed', 'true');

    // Store server-side
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
    const newValue = !nsfwEnabled;
    setNsfwEnabled(newValue);
    localStorage.setItem('nsfw_enabled', String(newValue));
  };

  return (
    <NsfwContext.Provider value={{ nsfwEnabled, toggleNsfw, confirmAge, hasConfirmedAge }}>
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
