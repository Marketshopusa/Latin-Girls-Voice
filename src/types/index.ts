// === Sistema de Voces Gemini 2.5 Flash TTS ===
// Acentos regionales + Tonos expresivos como atributos independientes

// Acentos regionales latinoamericanos
export type AccentType = 
  | 'VENEZOLANA'      // Acento caraqueño venezolano
  | 'COLOMBIANA'      // Acento paisa colombiano
  | 'MEXICANA'        // Acento mexicano suave
  | 'ARGENTINA'       // Acento rioplatense con voseo
  | 'CHILENA'         // Acento chileno
  | 'PERUANA'         // Acento limeño
  | 'NEUTRAL';        // Español latino neutro

// Tonos expresivos de voz
export type ToneType = 
  // Coqueta y Seductora
  | 'COQUETA'         // Juguetona, insinuante, con picardía
  | 'SEDUCTORA'       // Provocativa, atrevida, tentadora
  // Sexy e Intensa
  | 'SEXY'            // Sensual, apasionada, ardiente
  | 'INTENSA'         // Apasionada, dominante, poderosa
  // Juvenil y Dulce
  | 'JUVENIL'         // Fresca, alegre, enérgica
  | 'DULCE'           // Tierna, cariñosa, maternal
  // Susurrante e Íntima
  | 'SUSURRANTE'      // Suave, cercana, al oído
  | 'INTIMA'          // Personal, confidencial, cercana
  // Neutro
  | 'NEUTRAL';        // Tono natural sin estilo específico

// Voces base de Gemini (interno - no exponer a UI)
export type GeminiVoice = 'Kore' | 'Aoede' | 'Puck' | 'Charon';

// VoiceType legacy para compatibilidad (mapea a accent+tone)
export type VoiceType = 
  | 'LATINA_CALIDA'
  | 'LATINA_COQUETA'
  | 'MEXICANA_DULCE'
  | 'LATINO_PROFUNDO'
  | 'LATINO_SUAVE'
  | 'VENEZOLANA'
  | 'COLOMBIANA'
  | 'ARGENTINA';

export interface Character {
  id: string;
  name: string;
  age: number;
  tagline: string;
  history: string;
  welcomeMessage: string;
  image: string;
  tags: string[];
  // Sistema de voz
  voice: VoiceType; // Legacy - se mantiene para compatibilidad
  accent?: AccentType; // Nuevo: acento regional
  tone?: ToneType; // Nuevo: tono expresivo
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

// Catálogo de acentos para UI
export const ACCENT_OPTIONS: { id: AccentType; label: string; icon: string; description: string }[] = [
  { id: 'VENEZOLANA', label: 'Venezolana', icon: '🇻🇪', description: 'Acento caraqueño con musicalidad caribeña' },
  { id: 'COLOMBIANA', label: 'Colombiana', icon: '🇨🇴', description: 'Acento paisa cálido y alegre' },
  { id: 'MEXICANA', label: 'Mexicana', icon: '🇲🇽', description: 'Acento mexicano suave y encantador' },
  { id: 'ARGENTINA', label: 'Argentina', icon: '🇦🇷', description: 'Acento rioplatense con voseo característico' },
  { id: 'CHILENA', label: 'Chilena', icon: '🇨🇱', description: 'Acento chileno distintivo' },
  { id: 'PERUANA', label: 'Peruana', icon: '🇵🇪', description: 'Acento limeño suave' },
  { id: 'NEUTRAL', label: 'Neutral', icon: '🌎', description: 'Español latino neutro sin acento marcado' },
];

// Catálogo de tonos para UI
export const TONE_OPTIONS: { id: ToneType; label: string; icon: string; description: string; category: string }[] = [
  // Coqueta y Seductora
  { id: 'COQUETA', label: 'Coqueta', icon: '😏', description: 'Juguetona, insinuante, con picardía', category: 'Coqueta y Seductora' },
  { id: 'SEDUCTORA', label: 'Seductora', icon: '💋', description: 'Provocativa, atrevida, tentadora', category: 'Coqueta y Seductora' },
  // Sexy e Intensa
  { id: 'SEXY', label: 'Sexy', icon: '🔥', description: 'Sensual, apasionada, ardiente', category: 'Sexy e Intensa' },
  { id: 'INTENSA', label: 'Intensa', icon: '⚡', description: 'Apasionada, dominante, poderosa', category: 'Sexy e Intensa' },
  // Juvenil y Dulce
  { id: 'JUVENIL', label: 'Juvenil', icon: '✨', description: 'Fresca, alegre, enérgica', category: 'Juvenil y Dulce' },
  { id: 'DULCE', label: 'Dulce', icon: '🌸', description: 'Tierna, cariñosa, maternal', category: 'Juvenil y Dulce' },
  // Susurrante e Íntima
  { id: 'SUSURRANTE', label: 'Susurrante', icon: '🤫', description: 'Suave, cercana, como al oído', category: 'Susurrante e Íntima' },
  { id: 'INTIMA', label: 'Íntima', icon: '💫', description: 'Personal, confidencial, cercana', category: 'Susurrante e Íntima' },
  // Neutro
  { id: 'NEUTRAL', label: 'Natural', icon: '🎙️', description: 'Tono natural sin estilo específico', category: 'Neutral' },
];

// Catálogo legacy de voces (para compatibilidad con UI existente)
export const VOICE_OPTIONS: { id: VoiceType; label: string; icon: string; description: string }[] = [
  { id: 'LATINA_CALIDA', label: 'Cálida', icon: '🌸', description: 'Voz femenina cálida y maternal' },
  { id: 'LATINA_COQUETA', label: 'Coqueta', icon: '💋', description: 'Voz femenina seductora y expresiva' },
  { id: 'MEXICANA_DULCE', label: 'Mexicana', icon: '🇲🇽', description: 'Voz con acento mexicano suave' },
  { id: 'VENEZOLANA', label: 'Venezolana', icon: '🇻🇪', description: 'Acento venezolano caraqueño' },
  { id: 'COLOMBIANA', label: 'Colombiana', icon: '🇨🇴', description: 'Acento colombiano paisa' },
  { id: 'ARGENTINA', label: 'Argentina', icon: '🇦🇷', description: 'Acento argentino rioplatense' },
  { id: 'LATINO_PROFUNDO', label: 'Profundo', icon: '🔥', description: 'Voz masculina grave y dominante' },
  { id: 'LATINO_SUAVE', label: 'Suave', icon: '💫', description: 'Voz masculina suave y romántica' },
];
