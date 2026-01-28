import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NsfwContextType {
  nsfwEnabled: boolean;
  toggleNsfw: () => void;
  confirmAge: () => void;
  hasConfirmedAge: boolean;
}

const NsfwContext = createContext<NsfwContextType | undefined>(undefined);

export const NsfwProvider = ({ children }: { children: ReactNode }) => {
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [hasConfirmedAge, setHasConfirmedAge] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('nsfw_enabled');
    const ageConfirmed = localStorage.getItem('age_confirmed');
    if (stored === 'true' && ageConfirmed === 'true') {
      setNsfwEnabled(true);
      setHasConfirmedAge(true);
    }
  }, []);

  const confirmAge = () => {
    setHasConfirmedAge(true);
    localStorage.setItem('age_confirmed', 'true');
  };

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
