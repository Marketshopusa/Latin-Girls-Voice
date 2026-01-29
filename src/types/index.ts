// === Catálogo de voces Gemini 2.5 Flash TTS ===
// Voces naturales con control de acentos latinos via prompting

export type VoiceType = 
  // Voces base (estilo de personalidad)
  | 'LATINA_CALIDA'      // Kore - femenina cálida y maternal
  | 'LATINA_COQUETA'     // Kore - femenina seductora y coqueta
  | 'MEXICANA_DULCE'     // Aoede - femenina mexicana dulce
  | 'LATINO_PROFUNDO'    // Charon - masculino grave y dominante
  | 'LATINO_SUAVE'       // Puck - masculino suave y romántico
  // Acentos regionales específicos (Gemini)
  | 'VENEZOLANA'         // Kore - acento venezolano auténtico
  | 'COLOMBIANA'         // Kore - acento colombiano paisa
  | 'ARGENTINA';         // Aoede - acento argentino rioplatense

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

// Catálogo de voces Gemini TTS
export const VOICE_OPTIONS: { id: VoiceType; label: string; icon: string; description: string }[] = [
  // === Voces femeninas ===
  { 
    id: 'LATINA_CALIDA', 
    label: 'Cálida', 
    icon: '🌸', 
    description: 'Voz femenina cálida y maternal, perfecta para conversaciones íntimas' 
  },
  { 
    id: 'LATINA_COQUETA', 
    label: 'Coqueta', 
    icon: '💋', 
    description: 'Voz femenina seductora y expresiva, ideal para roleplay romántico' 
  },
  { 
    id: 'MEXICANA_DULCE', 
    label: 'Mexicana', 
    icon: '🇲🇽', 
    description: 'Voz femenina con acento mexicano suave y encantador' 
  },
  { 
    id: 'VENEZOLANA', 
    label: 'Venezolana', 
    icon: '🇻🇪', 
    description: 'Acento venezolano auténtico con musicalidad caribeña' 
  },
  { 
    id: 'COLOMBIANA', 
    label: 'Colombiana', 
    icon: '🇨🇴', 
    description: 'Acento colombiano paisa, cálido y alegre' 
  },
  { 
    id: 'ARGENTINA', 
    label: 'Argentina', 
    icon: '🇦🇷', 
    description: 'Acento argentino rioplatense con voseo característico' 
  },
  // === Voces masculinas ===
  { 
    id: 'LATINO_PROFUNDO', 
    label: 'Profundo', 
    icon: '🔥', 
    description: 'Voz masculina grave y dominante, transmite autoridad' 
  },
  { 
    id: 'LATINO_SUAVE', 
    label: 'Suave', 
    icon: '💫', 
    description: 'Voz masculina suave y romántica, reconfortante' 
  },
];
