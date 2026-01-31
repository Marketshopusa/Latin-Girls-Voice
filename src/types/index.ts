// === Sistema de Voces Dual: ElevenLabs + Google Cloud TTS ===
// ElevenLabs: Voces regionales auténticas (Colombia, Venezuela, Argentina, México)
// Google Cloud TTS: Voces Neural2 y Chirp 3: HD de alta calidad

// Proveedor de TTS
export type TTSProvider = 'elevenlabs' | 'google';

// Catálogo de voces - combinando ambos proveedores
export type VoiceType = 
  // === ELEVENLABS - Voces Regionales Auténticas ===
  | 'COLOMBIANA_PAISA'      // Yinet - Colombiana auténtica
  | 'COLOMBIANA_SUAVE'      // Matilda - Latina cálida
  | 'VENEZOLANA_CARAQUEÑA'  // Sarah - Expresiva directa
  | 'VENEZOLANA_GOCHA'      // Jessica - Suave tímida
  | 'LATINA_EXPRESIVA'      // Lily - Seductora
  | 'LATINA_FUERTE'         // Laura - Fuerte clara
  | 'MEXICANA_NATURAL'      // Gilfoy - Casual mexicana
  | 'ARGENTINA_PORTEÑA'     // Fer - Acento porteño
  | 'MASCULINA_PROFUNDA'    // George - Profunda
  | 'MASCULINA_SUAVE'       // River - Suave
  | 'MASCULINA_LATINA'      // Eleguar - Latina profunda
  // === GOOGLE CLOUD TTS - Voces Neural2 ===
  | 'es-US-Neural2-A'    // Femenina - Latina (RECOMENDADA)
  | 'es-US-Neural2-B'    // Masculina - Latino grave
  | 'es-US-Neural2-C'    // Masculina - Latino suave
  | 'es-ES-Neural2-A'    // Femenina - Española
  | 'es-ES-Neural2-B'    // Masculina - Español
  | 'es-ES-Neural2-C'    // Femenina - Española alternativa
  | 'es-ES-Neural2-D'    // Femenina - Española joven
  | 'es-ES-Neural2-E'    // Femenina - Española madura
  | 'es-ES-Neural2-F'    // Masculina - Español alternativo
  | 'es-MX-Neural2-A'    // Femenina - Mexicana
  | 'es-MX-Neural2-B'    // Masculina - Mexicano
  // === GOOGLE CLOUD TTS - Chirp 3: HD Premium ===
  | 'es-US-Chirp3-HD-Kore'    // Femenina Premium - Expresiva
  | 'es-US-Chirp3-HD-Aoede'   // Femenina Premium - Cálida
  | 'es-US-Chirp3-HD-Charon'  // Masculina Premium - Profunda
  | 'es-US-Chirp3-HD-Puck'    // Masculina Premium - Versátil
  | 'es-ES-Chirp3-HD-Kore'    // Femenina Premium España
  | 'es-ES-Chirp3-HD-Aoede'   // Femenina Premium España
  | 'es-ES-Chirp3-HD-Charon'  // Masculina Premium España
  | 'es-ES-Chirp3-HD-Puck';   // Masculina Premium España

// Género de voz
export type VoiceGender = 'FEMALE' | 'MALE';

// Región de voz
export type VoiceRegion = 'COLOMBIA' | 'VENEZUELA' | 'ARGENTINA' | 'MEXICO' | 'LATINO' | 'ESPAÑA';

// Calidad de voz
export type VoiceQuality = 'ELEVENLABS' | 'NEURAL2' | 'CHIRP3_HD';

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
  // === ELEVENLABS - VOCES REGIONALES AUTÉNTICAS ===
  {
    id: 'COLOMBIANA_PAISA',
    label: 'Colombiana Paisa',
    icon: '🇨🇴',
    description: 'Voz colombiana femenina auténtica - Yinet (ElevenLabs)',
    gender: 'FEMALE',
    region: 'COLOMBIA',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  {
    id: 'COLOMBIANA_SUAVE',
    label: 'Colombiana Suave',
    icon: '☕',
    description: 'Voz femenina latina cálida - Matilda (ElevenLabs)',
    gender: 'FEMALE',
    region: 'COLOMBIA',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  {
    id: 'VENEZOLANA_CARAQUEÑA',
    label: 'Venezolana Caraqueña',
    icon: '🇻🇪',
    description: 'Voz femenina expresiva y directa - Sarah (ElevenLabs)',
    gender: 'FEMALE',
    region: 'VENEZUELA',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  {
    id: 'VENEZOLANA_GOCHA',
    label: 'Venezolana Gocha',
    icon: '🌴',
    description: 'Voz femenina suave y tímida - Jessica (ElevenLabs)',
    gender: 'FEMALE',
    region: 'VENEZUELA',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  {
    id: 'LATINA_EXPRESIVA',
    label: 'Latina Expresiva',
    icon: '💋',
    description: 'Voz femenina seductora - Lily (ElevenLabs)',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  {
    id: 'LATINA_FUERTE',
    label: 'Latina Fuerte',
    icon: '💪',
    description: 'Voz femenina fuerte y clara - Laura (ElevenLabs)',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  {
    id: 'MEXICANA_NATURAL',
    label: 'Mexicana Natural',
    icon: '🇲🇽',
    description: 'Voz mexicana casual y calmada - Gilfoy (ElevenLabs)',
    gender: 'FEMALE',
    region: 'MEXICO',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  {
    id: 'ARGENTINA_PORTEÑA',
    label: 'Argentina Porteña',
    icon: '🇦🇷',
    description: 'Voz con acento porteño auténtico - Fer (ElevenLabs)',
    gender: 'MALE',
    region: 'ARGENTINA',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  {
    id: 'MASCULINA_PROFUNDA',
    label: 'Masculina Profunda',
    icon: '🔥',
    description: 'Voz masculina profunda - George (ElevenLabs)',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  {
    id: 'MASCULINA_SUAVE',
    label: 'Masculina Suave',
    icon: '💫',
    description: 'Voz masculina suave - River (ElevenLabs)',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  {
    id: 'MASCULINA_LATINA',
    label: 'Masculina Latina',
    icon: '🌟',
    description: 'Voz masculina latina profunda - Eleguar (ElevenLabs)',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'ELEVENLABS',
    provider: 'elevenlabs',
  },
  
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
  ELEVENLABS: VOICE_CATALOG.filter(v => v.provider === 'elevenlabs'),
  GOOGLE: VOICE_CATALOG.filter(v => v.provider === 'google'),
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
  ELEVENLABS: VOICE_CATALOG.filter(v => v.quality === 'ELEVENLABS'),
  NEURAL2: VOICE_CATALOG.filter(v => v.quality === 'NEURAL2'),
  CHIRP3_HD: VOICE_CATALOG.filter(v => v.quality === 'CHIRP3_HD'),
};

// Voz por defecto - Latina Neural (Google Cloud TTS)
export const DEFAULT_VOICE: VoiceType = 'es-US-Neural2-A';

// Helper para obtener configuración de voz
export const getVoiceConfig = (voiceType: VoiceType): VoiceConfig | undefined => {
  return VOICE_CATALOG.find(v => v.id === voiceType);
};

// Helper para determinar el proveedor de una voz
export const getVoiceProvider = (voiceType: VoiceType): TTSProvider => {
  const config = getVoiceConfig(voiceType);
  return config?.provider || 'google';
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
