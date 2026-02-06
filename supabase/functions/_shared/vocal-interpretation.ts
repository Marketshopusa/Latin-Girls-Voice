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
  // SEDUCTIVE - susurros, insinuaciones, deseo contenido
  seductive: [
    /\b(susurr[oa]|seduc|tentador[a]?|provoc|sensual|deseo|anhel|lujuria|excit[ao])\b/gi,
    /\*[^*]*(susurr|acerca|roce|acaric|beso suave)[^*]*\*/gi,
    /[.]{3,}/g,
    /\b(ven|acércate|mírame|tócame)\b/gi,
    /♡|♥|💋|😏/g,
  ],
  // PASSIONATE - fuego, intensidad controlada
  passionate: [
    /\b(pasión|ardiente|fuego|intenso|desenfrenado|salvaje|locura|arder)\b/gi,
    /!{2,}/g,
    /\b(quiero|necesito|dame|tómame|hazme|llévame)\b/gi,
    /\*[^*]*(besa|muerde|agarra|aprieta)[^*]*\*/gi,
  ],
  // PLAYFUL - coqueteo, risas, travesura
  playful: [
    /\b(juguetón|travieso|pícaro|divertido|bromea|risueñ[oa]|tont[oa])\b/gi,
    /\b(jaja|hehe|hihi|jiji|jejeje)\b/gi,
    /[~♡♥😜🤭]/g,
    /\*[^*]*(ríe|sonríe|guiña)[^*]*\*/gi,
  ],
  // INTENSE - clímax, éxtasis, sin control (NSFW/adulto)
  intense: [
    /\b(grit[ao]|gime|jadea|estremec|vibr|puls|explota|clímax|orgasm)\b/gi,
    /!{3,}/g,
    /\*[^*]*(gime|jadea|estremece|arquea|tiembla|grita|llora de placer)[^*]*\*/gi,
    /\b(más|sí|ahí|no pares|sigue)\b.*!/gi,
    /a{2,}h{1,}|o{2,}h{1,}|m{2,}h{1,}/gi,  // Aaaah, Ooooh, Mmmh
    /\b(profundo|dentro|fuerte|duro)\b/gi,
  ],
  // TENDER - amor suave, cariño
  tender: [
    /\b(tiern[oa]|dulce|suave|delicad[oa]|cariñ[oa]|amor|quer[ei]d[oa])\b/gi,
    /\b(mi amor|cariño|corazón|cielo|bebé|mi vida)\b/gi,
    /\*[^*]*(abraza|acaricia suave|beso tierno)[^*]*\*/gi,
  ],
  // EXCITED - emoción, entusiasmo  
  excited: [
    /\b(emocion|entusiasm|increíble|genial|wow|guau|asombroso)\b/gi,
    /!+/g,
    /\b(sí|vamos|dale|perfecto)\b.*!/gi,
  ],
  // WHISPER - secretos, intimidad susurrada
  whisper: [
    /\*[^*]*(susurr|al oído|bajito|en secreto)[^*]*\*/gi,
    /\b(secreto|silencio|callad[oa]|bajito|shhh)\b/gi,
    /\.\.\./g,
  ],
  // DRAMATIC - teatral, emocional extremo
  dramatic: [
    /\b(dramátic|teatral|exager|monumental|épic|trágic)\b/gi,
    /[—–]/g,
    /\b(jamás|nunca|para siempre|eternamente)\b/gi,
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
 * Genera configuración de voz optimizada para actuación EXTREMA
 * 
 * CRÍTICO: Para actuación real necesitamos:
 * - stability MUY BAJA (0.05-0.2) = máxima variación emocional
 * - style MUY ALTO (0.8-1.0) = máxima expresividad
 * - speed variable según emoción
 */
export function getVoiceActingSettings(context: EmotionalContext): VoiceActingSettings {
  // Ajustar intensidad basada en el contexto
  const intensityBoost = context.intensity * 0.15;
  
  // Base: voz MUY expresiva - casi inestable para máxima emoción
  const base: VoiceActingSettings = {
    stability: 0.15,          // MUY bajo = máxima variación expresiva
    similarityBoost: 0.65,    // Reducido para más libertad de actuación
    style: 0.85,              // MUY alto = máxima dramatización
    useSpeakerBoost: true,
    speed: 1.0,
  };
  
  // Ajustar según emoción - VALORES EXTREMOS para actuación real
  switch (context.emotion) {
    case 'seductive':
      return {
        ...base,
        stability: Math.max(0.05, 0.12 - intensityBoost),  // Ultra bajo
        similarityBoost: 0.55,
        style: Math.min(1.0, 0.9 + intensityBoost),        // Casi máximo
        speed: 0.78,         // Muy lento, sensual, arrastrado
      };
    
    case 'passionate':
      return {
        ...base,
        stability: Math.max(0.05, 0.08 - intensityBoost),  // Ultra bajo
        similarityBoost: 0.5,
        style: Math.min(1.0, 0.95 + intensityBoost),       // Máximo
        speed: 1.15,         // Rápido, intenso, sin control
      };
    
    case 'playful':
      return {
        ...base,
        stability: Math.max(0.1, 0.2 - intensityBoost),
        style: Math.min(1.0, 0.8 + intensityBoost),
        speed: 1.08,
      };
    
    case 'intense':
      return {
        ...base,
        stability: 0.05,      // MÍNIMO - máxima expresión sin control
        similarityBoost: 0.45,
        style: 1.0,           // MÁXIMO - gritos, jadeos, gemidos
        speed: 1.2,           // Muy rápido, frenético
      };
    
    case 'tender':
      return {
        ...base,
        stability: Math.max(0.1, 0.18 - intensityBoost),
        style: Math.min(1.0, 0.75 + intensityBoost),
        speed: 0.85,          // Lento, dulce
      };
    
    case 'whisper':
      return {
        ...base,
        stability: 0.08,      // Bajo para susurros expresivos
        similarityBoost: 0.6,
        style: 0.7,
        speed: 0.72,          // Muy lento, susurrante
      };
    
    case 'excited':
      return {
        ...base,
        stability: Math.max(0.08, 0.12 - intensityBoost),
        style: Math.min(1.0, 0.9 + intensityBoost),
        speed: 1.18,          // Rápido, emocionado
      };
    
    case 'dramatic':
      return {
        ...base,
        stability: 0.06,      // Ultra expresivo
        similarityBoost: 0.5,
        style: 1.0,           // Máxima dramatización
        speed: 0.9,           // Ligeramente lento para drama
      };
    
    default:
      // Incluso el neutral es más expresivo
      return {
        ...base,
        stability: 0.2,
        style: 0.7,
      };
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
