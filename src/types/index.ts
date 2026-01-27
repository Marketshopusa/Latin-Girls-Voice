export type VoiceType = 
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

export const VOICE_OPTIONS: { id: VoiceType; label: string; country: string; description: string }[] = [
  { id: 'ARGENTINA_SUAVE', label: 'Argentina (Suave)', country: 'AR', description: 'Acento rioplatense, usa "vos", "che" y tono seductor.' },
  { id: 'COLOMBIANA_PAISA', label: 'Colombiana (Paisa)', country: 'CO', description: 'Acento Paisa cariñoso, usa "mor", "pues", "bebé".' },
  { id: 'VENEZOLANA_GOCHA', label: 'Venezolana (Gocha)', country: 'VE', description: 'Acento andino, melodioso, usa "usted" de forma coqueta.' },
  { id: 'VENEZOLANA_CARACAS', label: 'Venezolana (Caracas)', country: 'VE', description: 'Acento central, directo y "sifrino".' },
  { id: 'MEXICANA_NORTENA', label: 'Mexicana (Norteña)', country: 'MX', description: 'Acento fuerte y golpeado.' },
  { id: 'MASCULINA_PROFUNDA', label: 'Masculina (Profunda)', country: '♂', description: 'Voz grave y autoritaria.' },
  { id: 'MASCULINA_SUAVE', label: 'Masculina (Suave)', country: '♂', description: 'Voz tranquila y relajada.' },
];
