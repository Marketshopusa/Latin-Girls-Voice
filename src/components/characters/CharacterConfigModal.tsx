 import { X, Volume2, Shield, Crown, Sparkles } from 'lucide-react';
 import { Character, VoiceType, normalizeVoiceType, ELEVENLABS_VOICE_CATALOG, GOOGLE_VOICE_CATALOG, isPremiumVoice } from '@/types';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
 import { useSubscription } from '@/contexts/SubscriptionContext';
 import { toast } from 'sonner';
 import { Badge } from '@/components/ui/badge';

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
  // Normalizar siempre a una voz real de Google (evita valores legacy que terminan en fallback)
  const [voice, setVoice] = useState<VoiceType>(normalizeVoiceType(character.voice));
  const [nsfw, setNsfw] = useState(character.nsfw);
   const { limits, plan } = useSubscription();
   const handleVoiceSelect = (voiceId: VoiceType) => {
     // Verificar si es voz premium y el usuario no tiene acceso
     if (isPremiumVoice(voiceId) && !limits.hasPremiumVoices) {
       toast.error('🎙️ Voces Premium', {
         description: 'Las voces de ElevenLabs solo están disponibles en planes Premium y Ultra.',
         action: {
           label: 'Ver planes',
           onClick: () => window.location.href = '/subscription',
         },
       });
       return;
     }
     setVoice(voiceId);
   };
 

  // Cuando cambiamos de personaje o reabrimos, resetea estado al valor real del personaje
  useEffect(() => {
    if (!isOpen) return;
    setHistory(character.history);
    setWelcomeMessage(character.welcomeMessage);
    setVoice(normalizeVoiceType(character.voice));
    setNsfw(character.nsfw);
  }, [character, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ history, welcomeMessage, voice, nsfw });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-surface-overlay/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">
            Configuración de {character.name}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin space-y-6">
          {/* History/Prompt */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Historia & Prompt (Solo IA)
            </label>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-muted input-dark text-sm resize-none"
              placeholder="Describe la personalidad y el escenario..."
            />
            <p className="text-xs text-muted-foreground">
              Aquí defines la personalidad y el escenario. El usuario NO ve esto.
            </p>
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
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span>Voz y Acento</span>
            </label>
             
             {/* ElevenLabs Premium Voices */}
             <div className="space-y-2">
               <div className="flex items-center gap-2 text-xs text-primary">
                 <Crown className="h-3.5 w-3.5" />
                 <span className="font-medium">Voces Premium (ElevenLabs)</span>
                 <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary border-0">
                   PREMIUM
                 </Badge>
               </div>
               <div className="grid grid-cols-3 gap-1.5">
                 {ELEVENLABS_VOICE_CATALOG.map((option) => {
                   const isLocked = !limits.hasPremiumVoices;
                   return (
                     <button
                       key={option.id}
                       onClick={() => handleVoiceSelect(option.id)}
                       className={cn(
                         'voice-chip text-left p-2 relative group',
                         voice === option.id && 'voice-chip-active',
                         isLocked && 'opacity-60'
                       )}
                     >
                       {isLocked && (
                         <div className="absolute top-1 right-1">
                         <Crown className="h-3 w-3 text-primary" />
                         </div>
                       )}
                       <div className="flex items-center gap-1.5 mb-0.5">
                         <span className="text-sm">
                           {option.icon}
                         </span>
                         <span className={cn(
                           'font-medium text-xs truncate',
                           voice === option.id ? 'text-primary' : 'text-foreground'
                         )}>
                           {option.label}
                         </span>
                       </div>
                       <p className="text-[10px] text-muted-foreground line-clamp-1">
                         {option.description}
                       </p>
                     </button>
                   );
                 })}
               </div>
             </div>
 
             {/* Google Cloud TTS Standard Voices */}
             <div className="space-y-2 mt-4">
               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                 <Sparkles className="h-3.5 w-3.5" />
                 <span className="font-medium">Voces Estándar (Google Cloud)</span>
               </div>
               <div className="grid grid-cols-3 gap-1.5">
                 {GOOGLE_VOICE_CATALOG.map((option) => (
                   <button
                     key={option.id}
                     onClick={() => handleVoiceSelect(option.id)}
                     className={cn(
                       'voice-chip text-left p-2',
                       voice === option.id && 'voice-chip-active'
                     )}
                   >
                     <div className="flex items-center gap-1.5 mb-0.5">
                       <span className="text-sm">
                         {option.icon}
                       </span>
                       <span className={cn(
                         'font-medium text-xs truncate',
                         voice === option.id ? 'text-primary' : 'text-foreground'
                       )}>
                         {option.label}
                       </span>
                     </div>
                     <p className="text-[10px] text-muted-foreground line-clamp-1">
                       {option.description}
                     </p>
                   </button>
                 ))}
               </div>
             </div>
          </div>

          {/* NSFW Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-destructive">
                  Modo NSFW (+18)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Permitir contenido explícito y sin censura.
                </p>
              </div>
            </div>
            <Switch
              checked={nsfw}
              onCheckedChange={setNsfw}
            />
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
    </div>
  );
};
