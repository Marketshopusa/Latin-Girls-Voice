export type VoiceType = 
  | 'LATINA_FEMENINA_1'
  | 'LATINA_FEMENINA_2'
  | 'MEXICANA_FEMENINA'
  | 'LATINA_MASCULINA_1'
  | 'LATINA_MASCULINA_2';

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

// Voice options using EXACT Google Cloud TTS voices
// These are the actual voice names available - no modifications
export const VOICE_OPTIONS: { id: VoiceType; label: string; country: string; description: string }[] = [
  // Catálogo limpio (solo voces Google Cloud, sin acentos “falsos” por país)
  { id: 'LATINA_FEMENINA_1', label: 'Latina Cálida', country: '🌎', description: 'es-US-Neural2-A · femenina, cálida y natural' },
  { id: 'LATINA_FEMENINA_2', label: 'Latina Coqueta', country: '🌎', description: 'es-US-Wavenet-A · femenina, coqueta y “sexy”' },
  { id: 'MEXICANA_FEMENINA', label: 'Mexicana Natural', country: 'MX', description: 'es-MX-Wavenet-A · femenina, clara y expresiva' },
  { id: 'LATINA_MASCULINA_1', label: 'Latino Profundo', country: '🌎', description: 'es-US-Neural2-B · masculino, grave y estable' },
  { id: 'LATINA_MASCULINA_2', label: 'Latino Suave', country: '🌎', description: 'es-US-Neural2-C · masculino, suave y cercano' },
];
