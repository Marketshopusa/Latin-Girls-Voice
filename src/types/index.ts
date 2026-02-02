// === Sistema de Voces: Google Cloud TTS ===
// (Se eliminó ElevenLabs de este proyecto.)

// Proveedor de TTS (solo Google)
export type TTSProvider = 'google';

// Catálogo de voces disponibles (Google Cloud TTS)
export type VoiceType =
  // === GOOGLE CLOUD TTS - Voces Neural2 ===
  | 'es-US-Neural2-A' // Femenina - Latino (recomendada)
  | 'es-US-Neural2-B' // Masculina - Latino grave
  | 'es-US-Neural2-C' // Masculina - Latino suave
  | 'es-ES-Neural2-A' // Femenina - España
  | 'es-ES-Neural2-B' // Masculina - España
  | 'es-ES-Neural2-C' // Femenina - España alternativa
  | 'es-ES-Neural2-D' // Femenina - España joven
  | 'es-ES-Neural2-E' // Femenina - España madura
  | 'es-ES-Neural2-F' // Masculina - España alternativo
  | 'es-MX-Neural2-A' // Femenina - México
  | 'es-MX-Neural2-B' // Masculina - México
  // === GOOGLE CLOUD TTS - Chirp 3: HD Premium ===
  | 'es-US-Chirp3-HD-Kore'
  | 'es-US-Chirp3-HD-Aoede'
  | 'es-US-Chirp3-HD-Charon'
  | 'es-US-Chirp3-HD-Puck'
  | 'es-ES-Chirp3-HD-Kore'
  | 'es-ES-Chirp3-HD-Aoede'
  | 'es-ES-Chirp3-HD-Charon'
  | 'es-ES-Chirp3-HD-Puck';

// IDs legacy (guardados en BD / versiones previas) que normalizamos a Google
export type LegacyVoiceId =
  | 'LATINA_CALIDA'
  | 'LATINA_COQUETA'
  | 'MEXICANA_DULCE'
  | 'LATINO_PROFUNDO'
  | 'LATINO_SUAVE'
  | 'VENEZOLANA'
  | 'COLOMBIANA'
  | 'ARGENTINA'
  // Legacy histórico (compatibilidad)
  | 'COLOMBIANA_PAISA'
  | 'COLOMBIANA_SUAVE'
  | 'VENEZOLANA_CARAQUEÑA'
  | 'VENEZOLANA_GOCHA'
  | 'LATINA_EXPRESIVA'
  | 'LATINA_FUERTE'
  | 'MEXICANA_NATURAL'
  | 'ARGENTINA_PORTEÑA'
  | 'MASCULINA_PROFUNDA'
  | 'MASCULINA_SUAVE'
  | 'MASCULINA_LATINA';

// Género de voz
export type VoiceGender = 'FEMALE' | 'MALE';

// Región de voz
export type VoiceRegion = 'COLOMBIA' | 'VENEZUELA' | 'ARGENTINA' | 'MEXICO' | 'LATINO' | 'ESPAÑA';

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
  provider: TTSProvider;
  // Para Google Cloud TTS
  languageCode?: string;
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
}

// Catálogo completo de voces para la UI
export const VOICE_CATALOG: VoiceConfig[] = [
  // === GOOGLE CLOUD TTS - NEURAL2 ESPAÑOL LATINO (es-US) ===
  {
    id: 'es-US-Neural2-A',
    label: 'Latina Neural',
    icon: '🌸',
    description: 'Voz femenina latina cálida (Google Cloud)',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-US',
    voiceName: 'es-US-Neural2-A',
  },
  {
    id: 'es-US-Neural2-B',
    label: 'Latino Profundo',
    icon: '🎤',
    description: 'Voz masculina latina grave (Google Cloud)',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-US',
    voiceName: 'es-US-Neural2-B',
  },
  {
    id: 'es-US-Neural2-C',
    label: 'Latino Suave',
    icon: '🎵',
    description: 'Voz masculina latina suave (Google Cloud)',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-US',
    voiceName: 'es-US-Neural2-C',
  },
  
  // === GOOGLE CLOUD TTS - NEURAL2 ESPAÑOL ESPAÑA (es-ES) ===
  {
    id: 'es-ES-Neural2-A',
    label: 'Española Clara',
    icon: '🇪🇸',
    description: 'Voz femenina española clara (Google Cloud)',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-A',
  },
  {
    id: 'es-ES-Neural2-B',
    label: 'Español Formal',
    icon: '🎩',
    description: 'Voz masculina española formal (Google Cloud)',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-B',
  },
  {
    id: 'es-ES-Neural2-C',
    label: 'Española Dulce',
    icon: '🌷',
    description: 'Voz femenina española dulce (Google Cloud)',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-C',
  },
  {
    id: 'es-ES-Neural2-D',
    label: 'Española Joven',
    icon: '✨',
    description: 'Voz femenina española joven (Google Cloud)',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-D',
  },
  {
    id: 'es-ES-Neural2-E',
    label: 'Española Elegante',
    icon: '👑',
    description: 'Voz femenina española madura (Google Cloud)',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-E',
  },
  {
    id: 'es-ES-Neural2-F',
    label: 'Español Amigable',
    icon: '😊',
    description: 'Voz masculina española amigable (Google Cloud)',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-F',
  },
  
  // === GOOGLE CLOUD TTS - NEURAL2 ESPAÑOL MÉXICO (es-MX) ===
  {
    id: 'es-MX-Neural2-A',
    label: 'Mexicana Cálida',
    icon: '🌮',
    description: 'Voz femenina mexicana cálida (Google Cloud)',
    gender: 'FEMALE',
    region: 'MEXICO',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-MX',
    voiceName: 'es-MX-Neural2-A',
  },
  {
    id: 'es-MX-Neural2-B',
    label: 'Mexicano Natural',
    icon: '🎺',
    description: 'Voz masculina mexicana natural (Google Cloud)',
    gender: 'MALE',
    region: 'MEXICO',
    quality: 'NEURAL2',
    provider: 'google',
    languageCode: 'es-MX',
    voiceName: 'es-MX-Neural2-B',
  },
  
  // === GOOGLE CLOUD TTS - CHIRP 3: HD PREMIUM ===
  {
    id: 'es-US-Chirp3-HD-Kore',
    label: 'Kore Premium',
    icon: '💎',
    description: 'Voz premium ultra expresiva (Google Chirp 3)',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    languageCode: 'es-US',
    voiceName: 'Kore',
  },
  {
    id: 'es-US-Chirp3-HD-Aoede',
    label: 'Aoede Premium',
    icon: '🎭',
    description: 'Voz premium cálida (Google Chirp 3)',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    languageCode: 'es-US',
    voiceName: 'Aoede',
  },
  {
    id: 'es-US-Chirp3-HD-Charon',
    label: 'Charon Premium',
    icon: '🌙',
    description: 'Voz masculina premium profunda (Google Chirp 3)',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    languageCode: 'es-US',
    voiceName: 'Charon',
  },
  {
    id: 'es-US-Chirp3-HD-Puck',
    label: 'Puck Premium',
    icon: '⭐',
    description: 'Voz masculina premium versátil (Google Chirp 3)',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    languageCode: 'es-US',
    voiceName: 'Puck',
  },
  {
    id: 'es-ES-Chirp3-HD-Kore',
    label: 'Kore España',
    icon: '💜',
    description: 'Voz premium española expresiva (Google Chirp 3)',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    languageCode: 'es-ES',
    voiceName: 'Kore',
  },
  {
    id: 'es-ES-Chirp3-HD-Aoede',
    label: 'Aoede España',
    icon: '🎪',
    description: 'Voz premium española cálida (Google Chirp 3)',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    languageCode: 'es-ES',
    voiceName: 'Aoede',
  },
  {
    id: 'es-ES-Chirp3-HD-Charon',
    label: 'Charon España',
    icon: '🌑',
    description: 'Voz masculina premium española (Google Chirp 3)',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    languageCode: 'es-ES',
    voiceName: 'Charon',
  },
  {
    id: 'es-ES-Chirp3-HD-Puck',
    label: 'Puck España',
    icon: '🌟',
    description: 'Voz masculina premium española (Google Chirp 3)',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    languageCode: 'es-ES',
    voiceName: 'Puck',
  },
];

// Opciones de voz agrupadas por proveedor
export const VOICE_OPTIONS_BY_PROVIDER = {
  GOOGLE: VOICE_CATALOG,
};

// Opciones de voz agrupadas por región
export const VOICE_OPTIONS_BY_REGION = {
  COLOMBIA: VOICE_CATALOG.filter(v => v.region === 'COLOMBIA'),
  VENEZUELA: VOICE_CATALOG.filter(v => v.region === 'VENEZUELA'),
  ARGENTINA: VOICE_CATALOG.filter(v => v.region === 'ARGENTINA'),
  MEXICO: VOICE_CATALOG.filter(v => v.region === 'MEXICO'),
  LATINO: VOICE_CATALOG.filter(v => v.region === 'LATINO'),
  ESPAÑA: VOICE_CATALOG.filter(v => v.region === 'ESPAÑA'),
};

export const VOICE_OPTIONS_BY_GENDER = {
  FEMALE: VOICE_CATALOG.filter(v => v.gender === 'FEMALE'),
  MALE: VOICE_CATALOG.filter(v => v.gender === 'MALE'),
};

export const VOICE_OPTIONS_BY_QUALITY = {
  NEURAL2: VOICE_CATALOG.filter(v => v.quality === 'NEURAL2'),
  CHIRP3_HD: VOICE_CATALOG.filter(v => v.quality === 'CHIRP3_HD'),
};

// Voz por defecto - Latina Neural (Google Cloud TTS)
export const DEFAULT_VOICE: VoiceType = 'es-US-Neural2-A';

// Normalización de voces legacy -> voces Google reales (para no perder compatibilidad)
const VALID_VOICES = new Set(VOICE_CATALOG.map(v => v.id));

export const LEGACY_VOICE_MAP: Record<string, VoiceType> = {
  // Legacy antiguos
  LATINA_CALIDA: 'es-US-Neural2-A',
  LATINA_COQUETA: 'es-ES-Neural2-D',
  MEXICANA_DULCE: 'es-MX-Neural2-A',
  LATINO_PROFUNDO: 'es-US-Neural2-B',
  LATINO_SUAVE: 'es-US-Neural2-C',
  VENEZOLANA: 'es-ES-Neural2-C',
  COLOMBIANA: 'es-US-Neural2-A',
  ARGENTINA: 'es-ES-Neural2-B',

  // IDs históricos (mapeados a Google con variedad real)
  COLOMBIANA_PAISA: 'es-US-Neural2-A',
  COLOMBIANA_SUAVE: 'es-US-Chirp3-HD-Aoede',
  VENEZOLANA_CARAQUEÑA: 'es-ES-Neural2-D',
  VENEZOLANA_GOCHA: 'es-ES-Neural2-C',
  LATINA_EXPRESIVA: 'es-US-Chirp3-HD-Kore',
  LATINA_FUERTE: 'es-ES-Neural2-A',
  MEXICANA_NATURAL: 'es-MX-Neural2-A',
  ARGENTINA_PORTEÑA: 'es-ES-Neural2-B',
  MASCULINA_PROFUNDA: 'es-US-Neural2-B',
  MASCULINA_SUAVE: 'es-US-Neural2-C',
  MASCULINA_LATINA: 'es-US-Chirp3-HD-Charon',
};

export const normalizeVoiceType = (voice: string | null | undefined): VoiceType => {
  if (!voice) return DEFAULT_VOICE;
  if (VALID_VOICES.has(voice as VoiceType)) return voice as VoiceType;
  return LEGACY_VOICE_MAP[voice] || DEFAULT_VOICE;
};

// Helper para obtener configuración de voz
export const getVoiceConfig = (voiceType: VoiceType): VoiceConfig | undefined => {
  return VOICE_CATALOG.find(v => v.id === voiceType);
};

// Helper para determinar el proveedor de una voz
// getVoiceProvider eliminado: solo usamos Google en este proyecto

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
