export type VoiceType = 
  | 'LATINA_FEMENINA_1'
  | 'LATINA_FEMENINA_2'
  | 'MEXICANA_FEMENINA'
  | 'LATINA_MASCULINA_1'
  | 'LATINA_MASCULINA_2'
  // Legacy voice types for backward compatibility
  | 'COLOMBIANA_PAISA'
  | 'VENEZOLANA_GOCHA'
  | 'VENEZOLANA_CARACAS'
  | 'ARGENTINA_SUAVE'
  | 'MEXICANA_NORTENA'
  | 'MASCULINA_PROFUNDA'
  | 'MASCULINA_SUAVE';

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
  { id: 'LATINA_FEMENINA_1', label: 'Latina Femenina 1', country: '🌎', description: 'Voz femenina latina natural (Neural2-A)' },
  { id: 'LATINA_FEMENINA_2', label: 'Latina Femenina 2', country: '🌎', description: 'Voz femenina latina suave (Wavenet-A)' },
  { id: 'MEXICANA_FEMENINA', label: 'Mexicana', country: 'MX', description: 'Voz femenina mexicana natural (Wavenet)' },
  { id: 'LATINA_MASCULINA_1', label: 'Latino Masculino 1', country: '🌎', description: 'Voz masculina latina natural (Neural2-B)' },
  { id: 'LATINA_MASCULINA_2', label: 'Latino Masculino 2', country: '🌎', description: 'Voz masculina latina suave (Neural2-C)' },
  // Legacy options for backward compatibility with existing characters
  { id: 'ARGENTINA_SUAVE', label: 'Argentina (Suave)', country: 'AR', description: 'Voz latina femenina (Legacy → Neural2)' },
  { id: 'COLOMBIANA_PAISA', label: 'Colombiana (Paisa)', country: 'CO', description: 'Voz latina femenina (Legacy → Neural2)' },
  { id: 'VENEZOLANA_GOCHA', label: 'Venezolana (Gocha)', country: 'VE', description: 'Voz latina femenina (Legacy → Wavenet)' },
  { id: 'VENEZOLANA_CARACAS', label: 'Venezolana (Caracas)', country: 'VE', description: 'Voz latina femenina (Legacy → Neural2)' },
  { id: 'MEXICANA_NORTENA', label: 'Mexicana (Norteña)', country: 'MX', description: 'Voz mexicana femenina (Legacy → Wavenet)' },
  { id: 'MASCULINA_PROFUNDA', label: 'Masculina (Profunda)', country: '♂', description: 'Voz masculina latina (Legacy → Neural2-B)' },
  { id: 'MASCULINA_SUAVE', label: 'Masculina (Suave)', country: '♂', description: 'Voz masculina latina (Legacy → Neural2-C)' },
];
