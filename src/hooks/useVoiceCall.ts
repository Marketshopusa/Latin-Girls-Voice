import { useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

interface UseVoiceCallOptions {
  characterName?: string;
}

export const useVoiceCall = (options: UseVoiceCallOptions = {}) => {
  const { limits } = useSubscription();

  const canUseVoiceCalls = limits.hasVoiceCalls;

  const checkVoiceCallAccess = useCallback(() => {
    if (!canUseVoiceCalls) {
      toast.error('Las llamadas de voz son exclusivas del plan Ultra', {
        description: 'Actualiza tu plan para desbloquear esta función.',
        action: {
          label: 'Ver planes',
          onClick: () => window.location.href = '/subscription',
        },
      });
      return false;
    }

    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta llamadas de voz', {
        description: 'Usa Chrome o Edge para esta función.',
      });
      return false;
    }

    return true;
  }, [canUseVoiceCalls]);

  return {
    canUseVoiceCalls,
    checkVoiceCallAccess,
  };
};

// Add Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
