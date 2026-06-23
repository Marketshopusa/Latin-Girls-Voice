import { X, Volume2, Shield, Crown, Sparkles, Play, Loader2, Pause, ChevronDown } from 'lucide-react';
import { Character, VoiceType, VoiceConfig, normalizeVoiceType, ELEVENLABS_VOICE_CATALOG, GOOGLE_VOICE_CATALOG, isPremiumVoice, getVoiceProvider } from '@/types';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useNsfw } from '@/contexts/NsfwContext';
import { AgeConfirmModal } from '@/components/modals/AgeConfirmModal';

interface CharacterConfigModalProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Character>) => void;
}

export const CharacterConfigModal = ({
  character,
  isOpen,
  onClose,
  onSave,
}: CharacterConfigModalProps) => {
  const [history, setHistory] = useState(character.history);
  const [welcomeMessage, setWelcomeMessage] = useState(character.welcomeMessage);
  const [voice, setVoice] = useState<VoiceType>(normalizeVoiceType(character.voice));
  const [nsfw, setNsfw] = useState(character.nsfw);
  const { limits } = useSubscription();
  const { hasConfirmedAge, confirmAge } = useNsfw();
  const [showAgeModal, setShowAgeModal] = useState(false);
  
  // Voice preview state
  const [previewingVoice, setPreviewingVoice] = useState<VoiceType | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setPreviewingVoice(null);
  }, []);

  const previewVoice = useCallback(async (voiceId: VoiceType) => {
    if (previewingVoice === voiceId) {
      stopPreview();
      return;
    }

    if (isPremiumVoice(voiceId) && !limits.hasPremiumVoices) {
      toast.error('🎙️ Voces Premium', {
        description: 'Las voces de ElevenLabs solo están disponibles en planes Premium y Ultra.',
      });
      return;
    }

    stopPreview();
    setIsPreviewLoading(true);
    setPreviewingVoice(voiceId);

    try {
      const provider = getVoiceProvider(voiceId);
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const endpoint = `${baseUrl}/functions/v1/${provider === 'elevenlabs' ? 'elevenlabs-tts' : 'google-cloud-tts'}`;

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ 
          text: "Hola, así suena mi voz. ¿Te gusta cómo hablo?", 
          voiceType: voiceId,
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const audioBlob = await response.blob();
      const playableBlob = audioBlob.type.includes('audio')
        ? audioBlob
        : new Blob([audioBlob], { type: 'audio/mpeg' });

      const audioUrl = URL.createObjectURL(playableBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPreviewingVoice(null);
      audio.onerror = () => {
        setPreviewingVoice(null);
        toast.error('Error al reproducir la voz');
      };

      await audio.play();
    } catch (error) {
      console.error('Voice preview error:', error);
      toast.error('No se pudo reproducir la voz');
      setPreviewingVoice(null);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [previewingVoice, stopPreview, limits.hasPremiumVoices]);

  useEffect(() => {
    return () => { stopPreview(); };
  }, [stopPreview]);

  const handleVoiceSelect = (voiceId: VoiceType) => {
    if (isPremiumVoice(voiceId) && !limits.hasPremiumVoices) {
      toast.error('🎙️ Voces Premium', {
        description: 'Las voces de ElevenLabs solo están disponibles en planes Premium y Ultra.',
        action: { label: 'Ver planes', onClick: () => window.location.href = '/subscription' },
      });
      return;
    }
    setVoice(voiceId);
  };

  useEffect(() => {
    if (isOpen) {
      setHistory(character.history);
      setWelcomeMessage(character.welcomeMessage);
      setVoice(normalizeVoiceType(character.voice));
      setNsfw(character.nsfw);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, character.id]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ history, welcomeMessage, voice, nsfw });
    onClose();
  };

  const handlePlusToggle = (checked: boolean) => {
    if (checked && !hasConfirmedAge) {
      setShowAgeModal(true);
      return;
    }
    setNsfw(checked);
  };

  const handleAgeConfirm = async () => {
    await confirmAge();
    setNsfw(true);
    setShowAgeModal(false);
  };

  const isCurrentVoiceElevenLabs = getVoiceProvider(voice) === 'elevenlabs';
  const isCurrentVoiceGoogle = getVoiceProvider(voice) === 'google';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-surface-overlay/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">
            Configuración de {character.name}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin space-y-6">
          {/* History/Prompt */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Historia & Prompt (Solo IA)</label>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-muted input-dark text-sm resize-none"
              placeholder="Describe la personalidad y el escenario..."
            />
            <p className="text-xs text-muted-foreground">Aquí defines la personalidad y el escenario. El usuario NO ve esto.</p>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Mensaje de Bienvenida</span>
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-muted input-dark text-sm resize-none"
              placeholder="El primer mensaje que dirá el personaje..."
            />
          </div>

          {/* Voice Selection */}
          <div className="space-y-4">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              <span>Voz y Acento</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Selecciona la voz de ElevenLabs (Premium) o de Google Cloud (Estándar).
            </p>

            <div className="space-y-3">
              {/* ElevenLabs Select */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Crown className="h-3.5 w-3.5" />
                  <span className="font-medium">Voces de ElevenLabs (Premium)</span>
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary border-0">PREMIUM</Badge>
                </div>
                <div className="flex gap-2">
                  <select
                    value={isCurrentVoiceElevenLabs ? voice : ''}
                    onChange={(e) => {
                      const selectedVal = e.target.value as VoiceType;
                      if (selectedVal) {
                        handleVoiceSelect(selectedVal);
                        stopPreview();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Seleccionar voz de ElevenLabs --</option>
                    {ELEVENLABS_VOICE_CATALOG.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.icon} {v.label} ({v.region})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!voice || !isCurrentVoiceElevenLabs || isPreviewLoading}
                    onClick={() => previewVoice(voice)}
                    className={cn(
                      "px-3 py-2 text-xs font-semibold rounded-lg bg-secondary border border-border hover:bg-primary hover:text-primary-foreground flex items-center gap-1 transition-colors min-w-[90px] justify-center",
                      (previewingVoice === voice && isCurrentVoiceElevenLabs) && "bg-primary text-primary-foreground"
                    )}
                  >
                    {isPreviewLoading && previewingVoice === voice && isCurrentVoiceElevenLabs ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : previewingVoice === voice && isCurrentVoiceElevenLabs ? (
                      "Pausar"
                    ) : (
                      "Escuchar"
                    )}
                  </button>
                </div>
              </div>

              {/* Google Cloud Select */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="font-medium">Voces de Google Cloud (Estándar)</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={isCurrentVoiceGoogle ? voice : ''}
                    onChange={(e) => {
                      const selectedVal = e.target.value as VoiceType;
                      if (selectedVal) {
                        handleVoiceSelect(selectedVal);
                        stopPreview();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Seleccionar voz de Google Cloud --</option>
                    {GOOGLE_VOICE_CATALOG.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.icon} {v.label} ({v.region})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!voice || !isCurrentVoiceGoogle || isPreviewLoading}
                    onClick={() => previewVoice(voice)}
                    className={cn(
                      "px-3 py-2 text-xs font-semibold rounded-lg bg-secondary border border-border hover:bg-primary hover:text-primary-foreground flex items-center gap-1 transition-colors min-w-[90px] justify-center",
                      (previewingVoice === voice && isCurrentVoiceGoogle) && "bg-primary text-primary-foreground"
                    )}
                  >
                    {isPreviewLoading && previewingVoice === voice && isCurrentVoiceGoogle ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : previewingVoice === voice && isCurrentVoiceGoogle ? (
                      "Pausar"
                    ) : (
                      "Escuchar"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Plus Mode */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                  nsfw ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-muted-foreground'
                )}>
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Modo Plus (+18)</p>
                  <p className="text-xs text-muted-foreground">Activa o desactiva el estilo Plus para este personaje.</p>
                </div>
              </div>
              <Switch checked={nsfw} onCheckedChange={handlePlusToggle} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors hover:shadow-glow"
          >
            💾 Guardar Cambios
          </button>
        </div>
      </div>
      <AgeConfirmModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={() => setShowAgeModal(false)}
      />
    </div>
  );
};
