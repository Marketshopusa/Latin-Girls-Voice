 // === Sistema de Voces: ElevenLabs (principal) + Google Cloud TTS (fallback) ===
 
 // Proveedor de TTS
 export type TTSProvider = 'elevenlabs' | 'google';
 
 // Catálogo de voces disponibles
 export type VoiceType =
   // === ELEVENLABS PREMIUM - VOCES VERIFICADAS EN LA BIBLIOTECA ===
   | 'el-venezolana-gocha'  // diominicana venezolana - Gocha accent
   | 'el-caraqueña'         // caraqueña loca - Caracas accent
   | 'el-colombiana-paisa'  // Vanessa - Paisa accent
   | 'el-colombiana-natural'// Jessica Natural - Colombian natural
   | 'el-colombiana-linda'  // Linda Gómez - Enérgica
   | 'el-lina'              // Lina - Soleada y amigable
   | 'el-teylu'             // Teylu - Dramática y cálida
   | 'el-maria'             // María - Radiante y melódica
   | 'el-ana-maria'         // Ana María - Calma y natural
   | 'el-daniela-valentina' // Daniela Valentina - Joven y optimista
   | 'el-ligia-elena'       // Ligia Elena - Tranquila y neutral
   | 'el-caraqueña-suave'   // Caraqueña suave - Malandra dulce
  | 'el-caraqueña-malandra' // Caraqueña malandra - Expresiva y grosera
   | 'el-pana-vzla'          // La Pana Vzla - Joven caraqueña grave
   | 'el-dominic-p'          // Dominic P - Caraqueña con estilo dominicano
   | 'el-caracas01'          // Caracas 01 - Ultra-natural malandrosa
   | 'el-vzla-candy'         // VZLA Candy - Dulce venezolana de San Cristóbal
   | 'el-paisa-dulce'        // Paisa Dulce - Colombiana paisa tierna
   | 'el-arg-dulce'          // ARG Dulce - Argentina suave y soñadora
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
 
 // Tier de la voz (para restricciones de plan)
 export type VoiceTier = 'standard' | 'premium';

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
 export type VoiceQuality = 'NEURAL2' | 'CHIRP3_HD' | 'FLASH_V2_5';

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
   tier: VoiceTier;
  // Para Google Cloud TTS
  languageCode?: string;
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
}

// === ELEVENLABS PREMIUM VOICES - VOCES LATINAS DE TU BIBLIOTECA ===
export const ELEVENLABS_VOICE_CATALOG: VoiceConfig[] = [
  // === VOCES VENEZOLANAS ===
  {
    id: 'el-venezolana-gocha',
    label: 'Venezolana Gocha',
    icon: '🇻🇪',
    description: 'Acento gocho venezolano, expresiva y juvenil',
    gender: 'FEMALE',
    region: 'VENEZUELA',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
  {
    id: 'el-caraqueña',
    label: 'Caraqueña',
    icon: '🌴',
    description: 'Acento caraqueño, expresiva y femenina',
    gender: 'FEMALE',
    region: 'VENEZUELA',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
  // === VOCES COLOMBIANAS ===
  {
    id: 'el-colombiana-paisa',
    label: 'Vanessa Paisa',
    icon: '🇨🇴',
    description: 'Colombiana paisa, cálida y carismática',
    gender: 'FEMALE',
    region: 'COLOMBIA',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
  {
    id: 'el-colombiana-natural',
    label: 'Jessica Natural',
    icon: '💚',
    description: 'Colombiana natural, cálida y clara',
    gender: 'FEMALE',
    region: 'COLOMBIA',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
  {
    id: 'el-colombiana-linda',
    label: 'Linda Enérgica',
    icon: '⚡',
    description: 'Colombiana enérgica y optimista',
    gender: 'FEMALE',
    region: 'COLOMBIA',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
  // === VOCES LATINAS GENERALES ===
  {
    id: 'el-lina',
    label: 'Lina Soleada',
    icon: '☀️',
    description: 'Soleada, amable y amigable',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
  {
    id: 'el-teylu',
    label: 'Teylu Dramática',
    icon: '🎭',
    description: 'Segura, dramática y cálida',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
  {
    id: 'el-maria',
    label: 'María Radiante',
    icon: '✨',
    description: 'Cálida, radiante y melódica',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
  {
    id: 'el-ana-maria',
    label: 'Ana María Calma',
    icon: '🌊',
    description: 'Calma, natural y clara',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
  {
    id: 'el-daniela-valentina',
    label: 'Daniela Joven',
    icon: '🌸',
    description: 'Joven, optimista y animada',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
  {
    id: 'el-ligia-elena',
    label: 'Ligia Elena Serena',
    icon: '🍃',
    description: 'Tranquila, pulida y neutral',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'FLASH_V2_5',
    provider: 'elevenlabs',
    tier: 'premium',
  },
   {
     id: 'el-caraqueña-suave',
     label: 'Caraqueña Suave',
     icon: '🌺',
     description: 'Malandra caraqueña dulce y suavecita, 18 años',
     gender: 'FEMALE',
     region: 'VENEZUELA',
     quality: 'FLASH_V2_5',
     provider: 'elevenlabs',
     tier: 'premium',
   },
   {
     id: 'el-caraqueña-malandra',
     label: 'Malandra Caraqueña',
     icon: '💋',
     description: 'Caraqueña zumbada y expresiva, 25 años',
     gender: 'FEMALE',
     region: 'VENEZUELA',
     quality: 'FLASH_V2_5',
     provider: 'elevenlabs',
     tier: 'premium',
   },
   {
     id: 'el-pana-vzla',
     label: 'La Pana Vzla',
     icon: '🔥',
     description: 'Joven caraqueña, tono grave rasposo y retador',
     gender: 'FEMALE',
     region: 'VENEZUELA',
     quality: 'FLASH_V2_5',
     provider: 'elevenlabs',
     tier: 'premium',
   },
   {
     id: 'el-dominic-p',
     label: 'Dominic P',
     icon: '🌴',
     description: 'Caraqueña con estilo dominicano, juguetona',
     gender: 'FEMALE',
     region: 'VENEZUELA',
     quality: 'FLASH_V2_5',
     provider: 'elevenlabs',
     tier: 'premium',
   },
  {
     id: 'el-caracas01',
     label: 'Caracas 01',
     icon: '🎤',
     description: 'Ultra-natural caraqueña, malandrosa y expresiva',
     gender: 'FEMALE',
     region: 'VENEZUELA',
     quality: 'FLASH_V2_5',
     provider: 'elevenlabs',
     tier: 'premium',
   },
   {
     id: 'el-vzla-candy',
     label: 'Dulces VZLA',
     icon: '🍬',
     description: 'Voz dulce y etérea, acento de San Cristóbal',
     gender: 'FEMALE',
     region: 'VENEZUELA',
     quality: 'FLASH_V2_5',
     provider: 'elevenlabs',
     tier: 'premium',
   },
   {
     id: 'el-paisa-dulce',
     label: 'Paisa Dulce',
     icon: '🌸',
     description: 'Colombiana paisa suave, tierna e inocente',
     gender: 'FEMALE',
     region: 'COLOMBIA',
     quality: 'FLASH_V2_5',
     provider: 'elevenlabs',
     tier: 'premium',
   },
   {
     id: 'el-arg-dulce',
     label: 'ARG Dulce',
     icon: '💕',
     description: 'Argentina suave, tierna y soñadora',
     gender: 'FEMALE',
     region: 'ARGENTINA',
     quality: 'FLASH_V2_5',
     provider: 'elevenlabs',
     tier: 'premium',
   },
];
 
// === GOOGLE CLOUD TTS VOICES (Standard) ===
export const GOOGLE_VOICE_CATALOG: VoiceConfig[] = [
  {
    id: 'es-US-Neural2-A',
    label: 'Latina Neural',
    icon: '🌸',
    description: 'Voz femenina latina cálida (Google Cloud)',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'NEURAL2',
    provider: 'google',
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'es-US-Neural2-C',
  },
  {
    id: 'es-ES-Neural2-A',
    label: 'Española Clara',
    icon: '🇪🇸',
    description: 'Voz femenina española clara (Google Cloud)',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'NEURAL2',
    provider: 'google',
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
    languageCode: 'es-ES',
    voiceName: 'es-ES-Neural2-F',
  },
  {
    id: 'es-MX-Neural2-A',
    label: 'Mexicana Cálida',
    icon: '🌮',
    description: 'Voz femenina mexicana cálida (Google Cloud)',
    gender: 'FEMALE',
    region: 'MEXICO',
    quality: 'NEURAL2',
    provider: 'google',
     tier: 'standard',
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
     tier: 'standard',
    languageCode: 'es-MX',
    voiceName: 'es-MX-Neural2-B',
  },
  {
    id: 'es-US-Chirp3-HD-Kore',
    label: 'Kore Premium',
    icon: '💎',
    description: 'Voz premium ultra expresiva (Google Chirp 3)',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
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
     tier: 'standard',
    languageCode: 'es-ES',
    voiceName: 'Puck',
  },
];

 // Catálogo completo de voces para la UI (ElevenLabs primero, luego Google)
 export const VOICE_CATALOG: VoiceConfig[] = [
   ...ELEVENLABS_VOICE_CATALOG,
   ...GOOGLE_VOICE_CATALOG,
 ];
 
 // Opciones de voz agrupadas por proveedor
 export const VOICE_OPTIONS_BY_PROVIDER = {
   ELEVENLABS: ELEVENLABS_VOICE_CATALOG,
   GOOGLE: GOOGLE_VOICE_CATALOG,
 };
 
 // Opciones de voz por tier
 export const VOICE_OPTIONS_BY_TIER = {
   premium: VOICE_CATALOG.filter(v => v.tier === 'premium'),
   standard: VOICE_CATALOG.filter(v => v.tier === 'standard'),
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
   FLASH_V2_5: VOICE_CATALOG.filter(v => v.quality === 'FLASH_V2_5'),
   NEURAL2: VOICE_CATALOG.filter(v => v.quality === 'NEURAL2'),
   CHIRP3_HD: VOICE_CATALOG.filter(v => v.quality === 'CHIRP3_HD'),
 };

// Voz por defecto - Latina Neural (Google Cloud TTS)
export const DEFAULT_VOICE: VoiceType = 'es-US-Neural2-A';

// Normalización de voces legacy -> voces Google reales (para no perder compatibilidad)
 const VALID_VOICES = new Set(VOICE_CATALOG.map(v => v.id));
 
 // Helper para determinar si una voz es premium
 export const isPremiumVoice = (voiceId: string): boolean => {
   const voice = VOICE_CATALOG.find(v => v.id === voiceId);
   return voice?.tier === 'premium';
 };
 
 // Helper para determinar el proveedor de una voz
 export const getVoiceProvider = (voiceId: string): TTSProvider => {
   const voice = VOICE_CATALOG.find(v => v.id === voiceId);
   return voice?.provider || 'google';
 };

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
