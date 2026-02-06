/**
 * Sistema de Interpretación Vocal Dinámica
 * 
 * Transforma texto plano en una actuación vocal rica con:
 * - Detección de emociones y estados de ánimo
 * - Marcadores SSML para pausas dramáticas
 * - Ajustes de intensidad y ritmo
 * - Expresiones no verbales (suspiros, gemidos, risas)
 */

// ============ TIPOS ============

export interface EmotionalContext {
  emotion: 'neutral' | 'seductive' | 'passionate' | 'playful' | 'intense' | 'tender' | 'excited' | 'whisper' | 'dramatic';
  intensity: number; // 0-1
  breathiness: boolean;
  hasNonVerbal: boolean;
  nonVerbalType?: 'moan' | 'sigh' | 'laugh' | 'gasp' | 'whisper';
}

export interface VoiceActingSettings {
  stability: number;      // 0-1 (menor = más expresivo)
  similarityBoost: number; // 0-1
  style: number;          // 0-1 (mayor = más dramático)
  useSpeakerBoost: boolean;
  speed: number;          // 0.7-1.2
}

// ============ DETECCIÓN EMOCIONAL ============

const EMOTION_PATTERNS: Record<string, RegExp[]> = {
  seductive: [
    /\b(susurr[oa]|seduc|tentador[a]?|provoc|sensual|deseo|anhel|lujuria)\b/gi,
    /\*[^*]*susurr[^*]*\*/gi,
    /[.]{3,}/g,
  ],
  passionate: [
    /\b(pasión|ardiente|fuego|intenso|desenfrenado|salvaje|locura)\b/gi,
    /!{2,}/g,
    /\b(quiero|necesito|dame|tómame)\b/gi,
  ],
  playful: [
    /\b(juguetón|travieso|pícaro|divertido|bromea|risueñ[oa])\b/gi,
    /\b(jaja|hehe|hihi|jiji)\b/gi,
    /[~♡♥]/g,
  ],
  intense: [
    /\b(grit[ao]|gime|jadea|estremec|vibr|puls|explota)\b/gi,
    /!{3,}/g,
    /\*[^*]*(gime|jadea|estremece)[^*]*\*/gi,
  ],
  tender: [
    /\b(tiern[oa]|dulce|suave|delicad[oa]|cariñ[oa]|amor)\b/gi,
    /\b(mi amor|cariño|corazón|cielo)\b/gi,
  ],
  excited: [
    /\b(emocion|entusiasm|increíble|genial|wow|guau)\b/gi,
    /!+/g,
  ],
  whisper: [
    /\*[^*]*susurr[^*]*\*/gi,
    /\b(secreto|silencio|callad[oa]|bajito)\b/gi,
  ],
  dramatic: [
    /\b(dramátic|teatral|exager|monumental|épic)\b/gi,
    /[—–]/g,
  ],
};

const NON_VERBAL_PATTERNS: Record<string, RegExp> = {
  moan: /\*[^*]*(gime|gimiendo|gemido)[^*]*\*/gi,
  sigh: /\*[^*]*(suspir[oa]|suspirando)[^*]*\*/gi,
  laugh: /\*[^*]*(ríe|riendo|carcajada|risita)[^*]*\*/gi,
  gasp: /\*[^*]*(jadea|jadeando|jadeo|ahog[ao])[^*]*\*/gi,
  whisper: /\*[^*]*(susurr[oa]|susurrando)[^*]*\*/gi,
};

/**
 * Detecta el contexto emocional del texto
 */
export function detectEmotionalContext(text: string): EmotionalContext {
  const scores: Record<string, number> = {};
  
  // Calcular puntuación para cada emoción
  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length;
      }
    }
    scores[emotion] = score;
  }
  
  // Encontrar emoción dominante
  let maxEmotion = 'neutral';
  let maxScore = 0;
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  }
  
  // Detectar expresiones no verbales
  let hasNonVerbal = false;
  let nonVerbalType: EmotionalContext['nonVerbalType'];
  
  for (const [type, pattern] of Object.entries(NON_VERBAL_PATTERNS)) {
    if (pattern.test(text)) {
      hasNonVerbal = true;
      nonVerbalType = type as EmotionalContext['nonVerbalType'];
      break;
    }
  }
  
  // Calcular intensidad (0-1) basada en puntuación
  const intensity = Math.min(maxScore / 5, 1);
  
  // Detectar si el texto sugiere voz entrecortada/breathiness
  const breathiness = /[.]{3,}|[~♡]|susurr|jadea/i.test(text);
  
  return {
    emotion: maxEmotion as EmotionalContext['emotion'],
    intensity,
    breathiness,
    hasNonVerbal,
    nonVerbalType,
  };
}

// ============ CONFIGURACIÓN DE VOZ DINÁMICA ============

/**
 * Genera configuración de voz optimizada para actuación
 */
export function getVoiceActingSettings(context: EmotionalContext): VoiceActingSettings {
  // Base: voz más expresiva que estable
  const base: VoiceActingSettings = {
    stability: 0.35,        // Más bajo = más variación expresiva
    similarityBoost: 0.78,
    style: 0.55,            // Estilo moderado-alto
    useSpeakerBoost: true,
    speed: 1.0,
  };
  
  // Ajustar según emoción
  switch (context.emotion) {
    case 'seductive':
      return {
        ...base,
        stability: 0.25,
        style: 0.7,
        speed: 0.88,         // Más lento, sensual
      };
    
    case 'passionate':
      return {
        ...base,
        stability: 0.2,
        style: 0.85,
        speed: 1.08,         // Más rápido, intenso
      };
    
    case 'playful':
      return {
        ...base,
        stability: 0.4,
        style: 0.65,
        speed: 1.05,
      };
    
    case 'intense':
      return {
        ...base,
        stability: 0.15,     // Muy expresivo
        style: 0.9,
        speed: 1.1,
      };
    
    case 'tender':
      return {
        ...base,
        stability: 0.45,
        style: 0.5,
        speed: 0.92,
      };
    
    case 'whisper':
      return {
        ...base,
        stability: 0.5,
        style: 0.4,
        speed: 0.85,
      };
    
    case 'excited':
      return {
        ...base,
        stability: 0.3,
        style: 0.75,
        speed: 1.12,
      };
    
    case 'dramatic':
      return {
        ...base,
        stability: 0.2,
        style: 0.95,
        speed: 0.95,
      };
    
    default:
      return base;
  }
}

// ============ PREPROCESAMIENTO DE TEXTO ============

/**
 * Prepara el texto para actuación vocal dinámica
 * - Añade pausas dramáticas
 * - Marca énfasis
 * - Limpia formato pero preserva intención emocional
 */
export function prepareTextForActing(text: string): string {
  let processed = text;
  
  // 1. Eliminar asteriscos pero preservar el contenido emocional
  // *suspira profundamente* -> (pausa) suspira profundamente
  processed = processed.replace(/\*([^*]+)\*/g, (_, content) => {
    // Si es una acción/expresión, la mantenemos como guía contextual
    if (/suspir|gim|jade|rí[oe]|sonr/.test(content)) {
      return `... ${content.trim()} ...`;
    }
    return content;
  });
  
  // 2. Convertir guiones largos en pausas dramáticas
  processed = processed.replace(/[—–]+/g, '... ');
  
  // 3. Añadir respiraciones naturales en oraciones largas
  processed = processed.replace(/([^.!?]{80,}?)(\s+)/g, (match, sentence, space) => {
    // Insertar pausa natural cada ~80 caracteres si no hay puntuación
    const midpoint = sentence.lastIndexOf(' ', 40);
    if (midpoint > 20) {
      return sentence.slice(0, midpoint) + ', ' + sentence.slice(midpoint + 1) + space;
    }
    return match;
  });
  
  // 4. Enfatizar palabras clave emocionales con pausas
  const emphasisWords = [
    'amor', 'deseo', 'pasión', 'fuego', 'locura',
    'quiero', 'necesito', 'dame', 'tómame', 'mírame',
    'siempre', 'nunca', 'jamás', 'para siempre',
  ];
  
  for (const word of emphasisWords) {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    processed = processed.replace(regex, '... $1');
  }
  
  // 5. Limpiar pausas excesivas
  processed = processed.replace(/\.{4,}/g, '...');
  processed = processed.replace(/,{2,}/g, ',');
  processed = processed.replace(/\s+/g, ' ');
  
  return processed.trim();
}

// ============ GENERACIÓN SSML ============

/**
 * Genera SSML expresivo para Google Cloud TTS
 */
export function generateExpressiveSSML(text: string, context: EmotionalContext): string {
  let ssml = escapeXml(text);
  
  // Pausas según puntuación (más dramáticas que el estándar)
  const pauseMultiplier = 1 + (context.intensity * 0.5);
  
  ssml = ssml
    .replace(/…/g, `...<break time="${Math.round(400 * pauseMultiplier)}ms"/>`)
    .replace(/\.{3}/g, `...<break time="${Math.round(400 * pauseMultiplier)}ms"/>`)
    .replace(/([!?])\s*/g, `$1<break time="${Math.round(320 * pauseMultiplier)}ms"/>`)
    .replace(/([.])\s*/g, `$1<break time="${Math.round(350 * pauseMultiplier)}ms"/>`)
    .replace(/([,])\s*/g, `$1<break time="${Math.round(200 * pauseMultiplier)}ms"/>`);
  
  // Ajustar prosodia según emoción
  let prosodyAttrs = '';
  
  switch (context.emotion) {
    case 'seductive':
      prosodyAttrs = 'rate="slow" pitch="-1st"';
      break;
    case 'passionate':
      prosodyAttrs = 'rate="fast" pitch="+2st" volume="+2dB"';
      break;
    case 'whisper':
      prosodyAttrs = 'rate="slow" pitch="-2st" volume="-3dB"';
      break;
    case 'intense':
      prosodyAttrs = 'rate="medium" pitch="+3st" volume="+4dB"';
      break;
    case 'tender':
      prosodyAttrs = 'rate="slow" pitch="-1st" volume="-1dB"';
      break;
    case 'playful':
      prosodyAttrs = 'rate="medium" pitch="+1st"';
      break;
    case 'excited':
      prosodyAttrs = 'rate="fast" pitch="+2st"';
      break;
  }
  
  if (prosodyAttrs) {
    ssml = `<prosody ${prosodyAttrs}>${ssml}</prosody>`;
  }
  
  // Añadir respiración inicial si el contexto lo amerita
  if (context.breathiness || context.hasNonVerbal) {
    ssml = `<break time="150ms"/>${ssml}`;
  }
  
  return `<speak>${ssml}</speak>`;
}

/**
 * Escapa caracteres XML
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ============ PROMPT MAESTRO ============

/**
 * Prompt maestro para sistemas que soporten instrucciones de actuación
 * (Útil para ElevenLabs con el parámetro "text" procesado)
 */
export const VOICE_ACTING_DIRECTIVE = `
Actúa como un actor de doblaje experto. Tu tarea es interpretar el texto con una fidelidad emocional y regional absoluta. 
Debes identificar el origen del personaje y adaptar tu tono, cadencia y acento a esa región específica.
Tu interpretación debe ser natural, incluyendo pausas, respiraciones, suspiros y otras expresiones vocales no léxicas.
Modula la intensidad de tu voz para reflejar el estado emocional del personaje, desde un susurro seductor hasta un grito de pasión.
No leas el texto, vívelo.
`;

/**
 * Procesa texto completo para interpretación vocal
 */
export function processForVocalInterpretation(rawText: string): {
  processedText: string;
  context: EmotionalContext;
  voiceSettings: VoiceActingSettings;
  ssml: string;
} {
  // 1. Detectar contexto emocional
  const context = detectEmotionalContext(rawText);
  
  // 2. Preparar texto para actuación
  const processedText = prepareTextForActing(rawText);
  
  // 3. Obtener configuración de voz óptima
  const voiceSettings = getVoiceActingSettings(context);
  
  // 4. Generar SSML expresivo
  const ssml = generateExpressiveSSML(processedText, context);
  
  return {
    processedText,
    context,
    voiceSettings,
    ssml,
  };
}
