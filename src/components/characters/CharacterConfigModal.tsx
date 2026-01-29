import { X, Volume2, Shield } from 'lucide-react';
import { Character, VOICE_OPTIONS, VoiceType } from '@/types';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

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
  const [voice, setVoice] = useState<VoiceType>(character.voice);
  const [nsfw, setNsfw] = useState(character.nsfw);

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
            <div className="grid grid-cols-2 gap-2">
              {VOICE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setVoice(option.id)}
                  className={cn(
                    'voice-chip text-left p-3',
                    voice === option.id && 'voice-chip-active'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">
                      {option.icon}
                    </span>
                    <span className={cn(
                      'font-medium text-sm',
                      voice === option.id ? 'text-primary' : 'text-foreground'
                    )}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {option.description}
                  </p>
                </button>
              ))}
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
