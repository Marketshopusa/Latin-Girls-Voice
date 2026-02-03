import { useState, useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

// Default public agent ID for demo purposes
// Users with their own ElevenLabs account can configure their own agent
const DEFAULT_PUBLIC_AGENT_ID = '';

interface UseVoiceCallOptions {
  characterName?: string;
}

export const useVoiceCall = (options: UseVoiceCallOptions = {}) => {
  const { limits } = useSubscription();
  const [isCallActive, setIsCallActive] = useState(false);
  const [agentId, setAgentId] = useState(DEFAULT_PUBLIC_AGENT_ID);

  const canUseVoiceCalls = limits.hasVoiceCalls;

  const startCall = useCallback(() => {
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

    if (!agentId) {
      toast.error('Agent ID no configurado', {
        description: 'Necesitas proporcionar un Agent ID de ElevenLabs para usar las llamadas de voz.',
      });
      return false;
    }

    setIsCallActive(true);
    return true;
  }, [canUseVoiceCalls, agentId]);

  const endCall = useCallback(() => {
    setIsCallActive(false);
  }, []);

  const configureAgent = useCallback((newAgentId: string) => {
    setAgentId(newAgentId);
  }, []);

  return {
    isCallActive,
    canUseVoiceCalls,
    agentId,
    startCall,
    endCall,
    configureAgent,
  };
};
