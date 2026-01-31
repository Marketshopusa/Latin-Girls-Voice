import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'free' | 'basic' | 'premium' | 'ultra';

interface PlanLimits {
  maxCharacters: number; // personajes para conversar (free=2)
  maxCharactersCreated: number; // creación mensual
  maxImagesGenerated: number;
  hasNsfwAccess: boolean;
  hasTTS: boolean;
  hasPersistentMemory: boolean;
  hasUltraMemory: boolean;
  hasPremiumVoices: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxCharacters: 2,
    maxCharactersCreated: 0,
    maxImagesGenerated: 0,
    hasNsfwAccess: false,
    hasTTS: false,
    hasPersistentMemory: false,
    hasUltraMemory: false,
    hasPremiumVoices: false,
  },
  basic: {
    maxCharacters: Infinity,
    maxCharactersCreated: 20,
    maxImagesGenerated: 40,
    hasNsfwAccess: true,
    hasTTS: true,
    hasPersistentMemory: true,
    hasUltraMemory: false,
    hasPremiumVoices: false,
  },
  premium: {
    maxCharacters: Infinity,
    maxCharactersCreated: 50,
    maxImagesGenerated: 100,
    hasNsfwAccess: true,
    hasTTS: true,
    hasPersistentMemory: true,
    hasUltraMemory: false,
    hasPremiumVoices: false,
  },
  ultra: {
    maxCharacters: Infinity,
    maxCharactersCreated: Infinity,
    maxImagesGenerated: Infinity,
    hasNsfwAccess: true,
    hasTTS: true,
    hasPersistentMemory: true,
    hasUltraMemory: true,
    hasPremiumVoices: true,
  },
};

export const PLAN_PRICES = {
  basic: { monthly: 9.99, priceId: 'price_1SvkUOIjwEHDhwtUgp0ZRM3Q', productId: 'prod_TtXZYs9IgzQygU' },
  premium: { monthly: 19.99, priceId: 'price_1SvkUxIjwEHDhwtU9Q5jflbc', productId: 'prod_TtXae9AMEE0rAk' },
  ultra: { monthly: 29.99, priceId: 'price_1SvkVHIjwEHDhwtUU3dZtZ9B', productId: 'prod_TtXahShhTUYtCz' },
};

interface SubscriptionContextType {
  plan: PlanType;
  limits: PlanLimits;
  subscriptionEnd: string | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  checkout: (priceId: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useAuth();
  const [plan, setPlan] = useState<PlanType>('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshSubscription = useCallback(async () => {
    if (!user || !session) {
      setPlan('free');
      setSubscriptionEnd(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      setPlan(data.plan || 'free');
      setSubscriptionEnd(data.subscription_end);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setPlan('free');
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, refreshSubscription]);

  const checkout = async (priceId: string) => {
    if (!user) {
      throw new Error('Must be logged in to subscribe');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId },
    });

    if (error) throw error;
    if (data.url) {
      window.open(data.url, '_blank');
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      throw new Error('Must be logged in to manage subscription');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error) throw error;
    if (data.url) {
      window.open(data.url, '_blank');
    }
  };

  const limits = PLAN_LIMITS[plan];

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        limits,
        subscriptionEnd,
        isLoading,
        refreshSubscription,
        checkout,
        openCustomerPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
