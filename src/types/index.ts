 // === Sistema de Voces: ElevenLabs (principal) + Google Cloud TTS (fallback) ===
 
 // Proveedor de TTS
 export type TTSProvider = 'elevenlabs' | 'google';
 
 // Catálogo de voces disponibles
export type VoiceType =
  // === ELEVENLABS PREMIUM - VOCES VERIFICADAS EN LA BIBLIOTECA ===
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
  | 'el-dominic-p'          // Dominic P - Caraqueña con estilo dominicano
  | 'el-vzla-candy'         // VZLA Candy - Dulce venezolana de San Cristóbal
  | 'el-paisa-dulce'        // Paisa Dulce - Colombiana paisa tierna
  | 'el-arg-dulce'          // ARG Dulce - Argentina suave y soñadora
 // === GOOGLE CLOUD TTS - Chirp 3: HD Latinas (es-US) ===
  | 'es-US-Chirp3-HD-Achernar'
  | 'es-US-Chirp3-HD-Aoede'
  | 'es-US-Chirp3-HD-Leda'
  | 'es-US-Chirp3-HD-Kore'
  | 'es-US-Chirp3-HD-Sulafat'
  | 'es-US-Chirp3-HD-Zephyr'
  | 'es-US-Chirp3-HD-Gacrux'
  | 'es-US-Chirp3-HD-Callirrhoe'
  | 'es-US-Chirp3-HD-Achird'
  | 'es-US-Chirp3-HD-Charon'
  | 'es-US-Chirp3-HD-Fenrir'
  | 'es-US-Chirp3-HD-Orus'
  | 'es-US-Chirp3-HD-Puck'
  | 'es-US-Chirp3-HD-Schedar'
  // === GOOGLE CLOUD TTS - Chirp 3: HD España (es-ES) ===
  | 'es-ES-Chirp3-HD-Achernar'
  | 'es-ES-Chirp3-HD-Aoede'
  | 'es-ES-Chirp3-HD-Leda'
  | 'es-ES-Chirp3-HD-Kore'
  | 'es-ES-Chirp3-HD-Achird'
  | 'es-ES-Chirp3-HD-Charon'
  | 'es-ES-Chirp3-HD-Fenrir'
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
 export type VoiceQuality = 'CHIRP3_HD' | 'FLASH_V2_5';

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
 
// === GOOGLE CLOUD TTS - CHIRP 3: HD (Reemplazo completo de Neural2) ===
export const GOOGLE_VOICE_CATALOG: VoiceConfig[] = [
  // ═══════════════════════════════════════
  // 🌎 VOCES LATINAS (es-US) — FEMENINAS
  // ═══════════════════════════════════════
  {
    id: 'es-US-Chirp3-HD-Achernar',
    label: 'Achernar',
    icon: '✨',
    description: 'Latina brillante y expresiva',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Achernar',
  },
  {
    id: 'es-US-Chirp3-HD-Aoede',
    label: 'Aoede',
    icon: '🎭',
    description: 'Latina cálida y melódica',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Aoede',
  },
  {
    id: 'es-US-Chirp3-HD-Leda',
    label: 'Leda',
    icon: '🌙',
    description: 'Latina suave y envolvente',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Leda',
  },
  {
    id: 'es-US-Chirp3-HD-Kore',
    label: 'Kore',
    icon: '💎',
    description: 'Latina ultra expresiva y clara',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Kore',
  },
  {
    id: 'es-US-Chirp3-HD-Sulafat',
    label: 'Sulafat',
    icon: '🌺',
    description: 'Latina dulce y natural',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Sulafat',
  },
  {
    id: 'es-US-Chirp3-HD-Zephyr',
    label: 'Zephyr',
    icon: '🍃',
    description: 'Latina fresca y juvenil',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Zephyr',
  },
  {
    id: 'es-US-Chirp3-HD-Gacrux',
    label: 'Gacrux',
    icon: '🔮',
    description: 'Latina misteriosa y profunda',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Gacrux',
  },
  {
    id: 'es-US-Chirp3-HD-Callirrhoe',
    label: 'Callirrhoe',
    icon: '🌸',
    description: 'Latina elegante y sofisticada',
    gender: 'FEMALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Callirrhoe',
  },
  // ═══════════════════════════════════════
  // 🌎 VOCES LATINAS (es-US) — MASCULINAS
  // ═══════════════════════════════════════
  {
    id: 'es-US-Chirp3-HD-Achird',
    label: 'Achird',
    icon: '🎤',
    description: 'Latino firme y confiable',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Achird',
  },
  {
    id: 'es-US-Chirp3-HD-Charon',
    label: 'Charon',
    icon: '🌑',
    description: 'Latino profundo y misterioso',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Charon',
  },
  {
    id: 'es-US-Chirp3-HD-Fenrir',
    label: 'Fenrir',
    icon: '🐺',
    description: 'Latino intenso y dramático',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Fenrir',
  },
  {
    id: 'es-US-Chirp3-HD-Orus',
    label: 'Orus',
    icon: '⚡',
    description: 'Latino enérgico y versátil',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Orus',
  },
  {
    id: 'es-US-Chirp3-HD-Puck',
    label: 'Puck',
    icon: '⭐',
    description: 'Latino amigable y natural',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Puck',
  },
  {
    id: 'es-US-Chirp3-HD-Schedar',
    label: 'Schedar',
    icon: '🎵',
    description: 'Latino cálido y seductor',
    gender: 'MALE',
    region: 'LATINO',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-US',
    voiceName: 'Schedar',
  },
  // ═══════════════════════════════════════
  // 🇪🇸 VOCES ESPAÑA (es-ES) — FEMENINAS
  // ═══════════════════════════════════════
  {
    id: 'es-ES-Chirp3-HD-Achernar',
    label: 'Achernar 🇪🇸',
    icon: '✨',
    description: 'Española brillante y expresiva',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-ES',
    voiceName: 'Achernar',
  },
  {
    id: 'es-ES-Chirp3-HD-Aoede',
    label: 'Aoede 🇪🇸',
    icon: '🎭',
    description: 'Española cálida y melódica',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-ES',
    voiceName: 'Aoede',
  },
  {
    id: 'es-ES-Chirp3-HD-Leda',
    label: 'Leda 🇪🇸',
    icon: '🌙',
    description: 'Española suave y envolvente',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-ES',
    voiceName: 'Leda',
  },
  {
    id: 'es-ES-Chirp3-HD-Kore',
    label: 'Kore 🇪🇸',
    icon: '💜',
    description: 'Española ultra expresiva y clara',
    gender: 'FEMALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-ES',
    voiceName: 'Kore',
  },
  // ═══════════════════════════════════════
  // 🇪🇸 VOCES ESPAÑA (es-ES) — MASCULINAS
  // ═══════════════════════════════════════
  {
    id: 'es-ES-Chirp3-HD-Achird',
    label: 'Achird 🇪🇸',
    icon: '🎤',
    description: 'Español firme y confiable',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-ES',
    voiceName: 'Achird',
  },
  {
    id: 'es-ES-Chirp3-HD-Charon',
    label: 'Charon 🇪🇸',
    icon: '🌑',
    description: 'Español profundo y misterioso',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-ES',
    voiceName: 'Charon',
  },
  {
    id: 'es-ES-Chirp3-HD-Fenrir',
    label: 'Fenrir 🇪🇸',
    icon: '🐺',
    description: 'Español intenso y dramático',
    gender: 'MALE',
    region: 'ESPAÑA',
    quality: 'CHIRP3_HD',
    provider: 'google',
    tier: 'standard',
    languageCode: 'es-ES',
    voiceName: 'Fenrir',
  },
  {
    id: 'es-ES-Chirp3-HD-Puck',
    label: 'Puck 🇪🇸',
    icon: '🌟',
    description: 'Español amigable y natural',
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
    CHIRP3_HD: VOICE_CATALOG.filter(v => v.quality === 'CHIRP3_HD'),
  };

// Voz por defecto - Leda: suave, envolvente, versátil para cualquier personaje
export const DEFAULT_VOICE: VoiceType = 'es-US-Chirp3-HD-Leda';

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
  // Legacy antiguos → Chirp 3 HD
  LATINA_CALIDA: 'es-US-Chirp3-HD-Kore',
  LATINA_COQUETA: 'es-US-Chirp3-HD-Aoede',
  MEXICANA_DULCE: 'es-US-Chirp3-HD-Sulafat',
  LATINO_PROFUNDO: 'es-US-Chirp3-HD-Charon',
  LATINO_SUAVE: 'es-US-Chirp3-HD-Puck',
  VENEZOLANA: 'es-US-Chirp3-HD-Leda',
  COLOMBIANA: 'es-US-Chirp3-HD-Achernar',
  ARGENTINA: 'es-US-Chirp3-HD-Zephyr',

  // IDs históricos → Chirp 3 HD
  COLOMBIANA_PAISA: 'es-US-Chirp3-HD-Achernar',
  COLOMBIANA_SUAVE: 'es-US-Chirp3-HD-Aoede',
  VENEZOLANA_CARAQUEÑA: 'es-US-Chirp3-HD-Callirrhoe',
  VENEZOLANA_GOCHA: 'es-US-Chirp3-HD-Leda',
  LATINA_EXPRESIVA: 'es-US-Chirp3-HD-Kore',
  LATINA_FUERTE: 'es-US-Chirp3-HD-Gacrux',
  MEXICANA_NATURAL: 'es-US-Chirp3-HD-Sulafat',
  ARGENTINA_PORTEÑA: 'es-US-Chirp3-HD-Zephyr',
  MASCULINA_PROFUNDA: 'es-US-Chirp3-HD-Charon',
  MASCULINA_SUAVE: 'es-US-Chirp3-HD-Puck',
  MASCULINA_LATINA: 'es-US-Chirp3-HD-Fenrir',
  
  // Neural2 legacy → Chirp 3 HD
  'es-US-Neural2-A': 'es-US-Chirp3-HD-Kore',
  'es-US-Neural2-B': 'es-US-Chirp3-HD-Charon',
  'es-US-Neural2-C': 'es-US-Chirp3-HD-Puck',
  'es-ES-Neural2-A': 'es-ES-Chirp3-HD-Kore',
  'es-ES-Neural2-B': 'es-ES-Chirp3-HD-Charon',
  'es-ES-Neural2-C': 'es-ES-Chirp3-HD-Aoede',
  'es-ES-Neural2-D': 'es-ES-Chirp3-HD-Leda',
  'es-ES-Neural2-E': 'es-ES-Chirp3-HD-Achernar',
  'es-ES-Neural2-F': 'es-ES-Chirp3-HD-Puck',
  'es-MX-Neural2-A': 'es-US-Chirp3-HD-Sulafat',
  'es-MX-Neural2-B': 'es-US-Chirp3-HD-Orus',
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
