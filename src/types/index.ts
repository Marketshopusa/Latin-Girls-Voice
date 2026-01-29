// === Catálogo oficial de voces Neural2 de Google Cloud TTS ===
// Solo usamos voces Neural2 (la mejor calidad de Google) sin fallbacks.

export type VoiceType = 
  | 'LATINA_CALIDA'      // es-US-Neural2-A (femenina, cálida, natural)
  | 'LATINA_COQUETA'     // es-US-Neural2-A con ajuste sutil para tono más íntimo
  | 'MEXICANA_DULCE'     // es-MX-Neural2-A (femenina mexicana, dulce)
  | 'LATINO_PROFUNDO'    // es-US-Neural2-B (masculino, grave, estable)
  | 'LATINO_SUAVE';      // es-US-Neural2-C (masculino, suave, cercano)

export interface Character {
  id: string;
  name: string;
  age: number;
  tagline: string;
  history: string;
  welcomeMessage: string;
  image: string;
  tags: string[];
  voice: VoiceType;
  nsfw: boolean;
  messageCount?: number;
  style?: '2D' | 'Realistic' | 'Gal';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  audioUrl?: string;
  audioDuration?: number;
}

export interface Conversation {
  id: string;
  characterId: string;
  messages: Message[];
  lastMessage?: string;
  updatedAt: Date;
}

// Catálogo de voces - solo Neural2 de Google Cloud
export const VOICE_OPTIONS: { id: VoiceType; label: string; icon: string; description: string }[] = [
  { 
    id: 'LATINA_CALIDA', 
    label: 'Cálida', 
    icon: '🌸', 
    description: 'Voz femenina cálida y natural, perfecta para conversaciones íntimas' 
  },
  { 
    id: 'LATINA_COQUETA', 
    label: 'Coqueta', 
    icon: '💋', 
    description: 'Voz femenina seductora y expresiva, ideal para roleplay romántico' 
  },
  { 
    id: 'MEXICANA_DULCE', 
    label: 'Mexicana Dulce', 
    icon: '🇲🇽', 
    description: 'Voz femenina con acento mexicano suave y encantador' 
  },
  { 
    id: 'LATINO_PROFUNDO', 
    label: 'Profundo', 
    icon: '🔥', 
    description: 'Voz masculina grave y dominante, transmite seguridad' 
  },
  { 
    id: 'LATINO_SUAVE', 
    label: 'Suave', 
    icon: '💫', 
    description: 'Voz masculina suave y cercana, reconfortante y amable' 
  },
];
