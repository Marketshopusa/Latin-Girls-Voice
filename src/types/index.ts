// === Sistema de Voces Google Cloud TTS ===
// Solo voces Neural2 y Chirp 3: HD de alta calidad

// Catálogo completo de voces Google Cloud TTS
export type VoiceType = 
  // Neural2 - Español Latino (es-US)
  | 'es-US-Neural2-A'    // Femenina - Latina (RECOMENDADA)
  | 'es-US-Neural2-B'    // Masculina - Latino grave
  | 'es-US-Neural2-C'    // Masculina - Latino suave
  // Neural2 - Español España (es-ES)
  | 'es-ES-Neural2-A'    // Femenina - Española
  | 'es-ES-Neural2-B'    // Masculina - Español
  | 'es-ES-Neural2-C'    // Femenina - Española alternativa
  | 'es-ES-Neural2-D'    // Femenina - Española joven
  | 'es-ES-Neural2-E'    // Femenina - Española madura
  | 'es-ES-Neural2-F'    // Masculina - Español alternativo
  // Neural2 - Español México (es-MX)
  | 'es-MX-Neural2-A'    // Femenina - Mexicana
  | 'es-MX-Neural2-B'    // Masculina - Mexicano
  // Chirp 3: HD - Voces Premium (es-US)
  | 'es-US-Chirp3-HD-Kore'    // Femenina Premium - Expresiva
  | 'es-US-Chirp3-HD-Aoede'   // Femenina Premium - Cálida
  | 'es-US-Chirp3-HD-Charon'  // Masculina Premium - Profunda
  | 'es-US-Chirp3-HD-Puck'    // Masculina Premium - Versátil
  // Chirp 3: HD - Voces Premium (es-ES)
  | 'es-ES-Chirp3-HD-Kore'    // Femenina Premium España
  | 'es-ES-Chirp3-HD-Aoede'   // Femenina Premium España
  | 'es-ES-Chirp3-HD-Charon'  // Masculina Premium España
  | 'es-ES-Chirp3-HD-Puck';   // Masculina Premium España

// Género de voz
export type VoiceGender = 'FEMALE' | 'MALE';

// Región de voz
export type VoiceRegion = 'LATINO' | 'ESPAÑA' | 'MEXICO';

// Calidad de voz
export type VoiceQuality = 'NEURAL2' | 'CHIRP3_HD';

// Configuración de voz
export interface VoiceConfig {
  id: VoiceType;
  label: string;
  icon: string;
  description: string;
  gender: VoiceGender;
  region: VoiceRegion;
  quality: VoiceQuality;
  languageCode: string;
  voiceName: string;
}

// Catálogo completo de voces para la UI
export const VOICE_CATALOG: VoiceConfig[] = [
  // === NEURAL2 - ESPAÑOL LATINO (es-US) ===
  {
    id: 'es-US-Neural2-A',
    label: 'Latina Natural',
    icon: '🌸',
    description: 'Voz femenina latina cálida y natural - RECOMENDADA',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'NEURAL2',
    languageCode: 'es-US',
    voiceName: 'es-US-Neural2-A',
  },
  {
    id: 'es-US-Neural2-B',
    label: 'Latino Profundo',
    icon: '🔥',
    description: 'Voz masculina latina grave y dominante',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'NEURAL2',
    languageCode: 'es-US',
    voiceName: 'es-US-Neural2-B',
  },
  {
    id: 'es-US-Neural2-C',
    label: 'Latino Suave',
    icon: '💫',
    description: 'Voz masculina latina suave y amigable',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'NEURAL2',
    languageCode: 'es-US',
    voiceName: 'es-US-Neural2-C',
  },
  
  // === NEURAL2 - ESPAÑOL ESPAÑA (es-ES) ===
  {
    id: 'es-ES-Neural2-A',
    label: 'Española Clara',
    icon: '🇪🇸',
    description: 'Voz femenina española clara y profesional',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-A',
  },
  {
    id: 'es-ES-Neural2-B',
    label: 'Español Formal',
    icon: '🎩',
    description: 'Voz masculina española formal y seria',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-B',
  },
  {
    id: 'es-ES-Neural2-C',
    label: 'Española Dulce',
    icon: '🌷',
    description: 'Voz femenina española dulce y melodiosa',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-C',
  },
  {
    id: 'es-ES-Neural2-D',
    label: 'Española Joven',
    icon: '✨',
    description: 'Voz femenina española joven y enérgica',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-D',
  },
  {
    id: 'es-ES-Neural2-E',
    label: 'Española Elegante',
    icon: '👑',
    description: 'Voz femenina española madura y elegante',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-E',
  },
  {
    id: 'es-ES-Neural2-F',
    label: 'Español Amigable',
    icon: '😊',
    description: 'Voz masculina española amigable y cercana',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-F',
  },
  
  // === NEURAL2 - ESPAÑOL MÉXICO (es-MX) ===
  {
    id: 'es-MX-Neural2-A',
    label: 'Mexicana Cálida',
    icon: '🇲🇽',
    description: 'Voz femenina mexicana cálida y expresiva',
    gender: 'FEMALE',
    region: 'MEXICO',
    quality: 'NEURAL2',
    languageCode: 'es-MX',
    voiceName: 'es-MX-Neural2-A',
  },
  {
    id: 'es-MX-Neural2-B',
    label: 'Mexicano Natural',
    icon: '🌮',
    description: 'Voz masculina mexicana natural y amable',
    gender: 'MALE',
    region: 'MEXICO',
    quality: 'NEURAL2',
    languageCode: 'es-MX',
    voiceName: 'es-MX-Neural2-B',
  },
  
  // === CHIRP 3: HD - VOCES PREMIUM (es-US) ===
  {
    id: 'es-US-Chirp3-HD-Kore',
    label: 'Kore Premium',
    icon: '💎',
    description: 'Voz femenina premium ultra expresiva - Alta fidelidad',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    languageCode: 'es-US',
    voiceName: 'Kore',
  },
  {
    id: 'es-US-Chirp3-HD-Aoede',
    label: 'Aoede Premium',
    icon: '🎭',
    description: 'Voz femenina premium cálida y envolvente - Alta fidelidad',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    languageCode: 'es-US',
    voiceName: 'Aoede',
  },
  {
    id: 'es-US-Chirp3-HD-Charon',
    label: 'Charon Premium',
    icon: '🌙',
    description: 'Voz masculina premium profunda y resonante - Alta fidelidad',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    languageCode: 'es-US',
    voiceName: 'Charon',
  },
  {
    id: 'es-US-Chirp3-HD-Puck',
    label: 'Puck Premium',
    icon: '⭐',
    description: 'Voz masculina premium versátil y dinámica - Alta fidelidad',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    languageCode: 'es-US',
    voiceName: 'Puck',
  },
  
  // === CHIRP 3: HD - VOCES PREMIUM (es-ES) ===
  {
    id: 'es-ES-Chirp3-HD-Kore',
    label: 'Kore España',
    icon: '💜',
    description: 'Voz femenina premium española expresiva - Alta fidelidad',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    languageCode: 'es-ES',
    voiceName: 'Kore',
  },
  {
    id: 'es-ES-Chirp3-HD-Aoede',
    label: 'Aoede España',
    icon: '🎪',
    description: 'Voz femenina premium española cálida - Alta fidelidad',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    languageCode: 'es-ES',
    voiceName: 'Aoede',
  },
  {
    id: 'es-ES-Chirp3-HD-Charon',
    label: 'Charon España',
    icon: '🌑',
    description: 'Voz masculina premium española profunda - Alta fidelidad',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    languageCode: 'es-ES',
    voiceName: 'Charon',
  },
  {
    id: 'es-ES-Chirp3-HD-Puck',
    label: 'Puck España',
    icon: '🌟',
    description: 'Voz masculina premium española versátil - Alta fidelidad',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    languageCode: 'es-ES',
    voiceName: 'Puck',
  },
];

// Opciones de voz agrupadas por categoría para UI
export const VOICE_OPTIONS_BY_REGION = {
  LATINO: VOICE_CATALOG.filter(v => v.region === 'LATINO'),
  ESPAÑA: VOICE_CATALOG.filter(v => v.region === 'ESPAÑA'),
  MEXICO: VOICE_CATALOG.filter(v => v.region === 'MEXICO'),
};

export const VOICE_OPTIONS_BY_GENDER = {
  FEMALE: VOICE_CATALOG.filter(v => v.gender === 'FEMALE'),
  MALE: VOICE_CATALOG.filter(v => v.gender === 'MALE'),
};

export const VOICE_OPTIONS_BY_QUALITY = {
  NEURAL2: VOICE_CATALOG.filter(v => v.quality === 'NEURAL2'),
  CHIRP3_HD: VOICE_CATALOG.filter(v => v.quality === 'CHIRP3_HD'),
};

// Voz por defecto
export const DEFAULT_VOICE: VoiceType = 'es-US-Neural2-A';

// Helper para obtener configuración de voz
export const getVoiceConfig = (voiceType: VoiceType): VoiceConfig | undefined => {
  return VOICE_CATALOG.find(v => v.id === voiceType);
};

// === TIPOS LEGACY (para compatibilidad) ===
export type AccentType = 'NEUTRAL';
export type ToneType = 'NEUTRAL';

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

// Alias legacy para compatibilidad
export const VOICE_OPTIONS = VOICE_CATALOG.map(v => ({
  id: v.id,
  label: v.label,
  icon: v.icon,
  description: v.description,
}));
