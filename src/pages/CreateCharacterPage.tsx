import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Volume2, Shield, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { VOICE_OPTIONS, VoiceType, DEFAULT_VOICE } from '@/types';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useCreateCharacter } from '@/hooks/useCharacters';
import { toast } from 'sonner';
import { mediaToAiImageDataUrl } from '@/lib/mediaForAi';

const CreateCharacterPage = () => {
  const navigate = useNavigate();
  const { createCharacter, loading, error } = useCreateCharacter();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [tagline, setTagline] = useState('');
  const [history, setHistory] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [voice, setVoice] = useState<VoiceType>(DEFAULT_VOICE);
  const [nsfw, setNsfw] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isAnimatedImage, setIsAnimatedImage] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);

  const generateStoryWithAI = async () => {
    if (!mediaUrl) {
      toast.error('Primero sube una imagen o video para que la IA pueda analizarlo');
      return;
    }

    setGeneratingStory(true);
    
    try {
      // Para videos: extrae un fotograma y lo convierte a JPG. Para GIF/WEBP: usa el primer frame.
      const imageForAI = await mediaToAiImageDataUrl({
        mediaUrl,
        mediaType,
        maxDimension: 1280,
        quality: 0.9,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-character-story`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            imageBase64: imageForAI,
            name: name || undefined,
            age: age ? parseInt(age) : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check for content policy errors
        if (response.status === 400 || errorData.error?.includes('safety') || errorData.error?.includes('blocked')) {
          toast.error('La imagen contiene contenido que la IA no puede procesar. Por favor, escribe la historia manualmente.', {
            duration: 5000
          });
          return;
        }
        
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.tagline) setTagline(data.tagline);
      if (data.history) setHistory(data.history);
      if (data.welcomeMessage) setWelcomeMessage(data.welcomeMessage);
      
      toast.success('¡Historia generada con IA! Puedes editarla si lo deseas.');
    } catch (err) {
      console.error('AI generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al generar la historia';
      
      // Check if it's a content policy issue
      if (errorMessage.toLowerCase().includes('safety') || 
          errorMessage.toLowerCase().includes('blocked') ||
          errorMessage.toLowerCase().includes('policy')) {
        toast.error('La imagen es muy explícita para la IA. Escribe la historia manualmente.', {
          duration: 5000
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setGeneratingStory(false);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const mimeType = file.type.toLowerCase();
      
      // Detectar GIFs animados (son imágenes, no videos)
      const isGif = mimeType === 'image/gif' || fileName.endsWith('.gif');
      
      // Detectar videos reales (MP4, WEBM, etc.)
      const isRealVideo = (mimeType.startsWith('video/') || 
                          fileName.endsWith('.mp4') || 
                          fileName.endsWith('.webm') ||
                          fileName.endsWith('.mov') ||
                          fileName.endsWith('.avi')) && !isGif;
      
      // Detectar imágenes animadas (GIF, WEBP animado, APNG)
      const isAnimated = isGif || 
                        (mimeType === 'image/webp' && fileName.endsWith('.webp')) ||
                        (mimeType === 'image/apng' || fileName.endsWith('.apng'));
      
      const type = isRealVideo ? 'video' : 'image';
      
      console.log('File uploaded:', file.name, 'MIME:', mimeType, 'Type:', type, 'Animated:', isAnimated);
      
      setIsAnimatedImage(isAnimated);
      setMediaType(type);
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        console.log('File loaded, mediaUrl set, length:', result.length);
        setMediaUrl(result);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        toast.error('Error al leer el archivo');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!name || !age || !history || !tagline || !welcomeMessage) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const ageNum = parseInt(age);
    if (ageNum < 18) {
      toast.error('El personaje debe tener al menos 18 años');
      return;
    }

    const result = await createCharacter({
      name,
      age: ageNum,
      tagline,
      history,
      welcomeMessage,
      voice,
      nsfw,
      image: mediaUrl,
    });

    if (result) {
      toast.success(`¡${name} ha sido creado exitosamente!`);
      navigate('/');
    } else if (error) {
      toast.error(error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 px-6 py-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Crear Nuevo Personaje</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Image Upload */}
          <div className="space-y-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Avatar / Video de Perfil
              </label>
              <label className="block aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors cursor-pointer overflow-hidden">
                {mediaUrl ? (
                  mediaType === 'video' ? (
                    <video 
                      src={mediaUrl} 
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img 
                      src={mediaUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Upload className="h-12 w-12 mb-3" />
                    <span className="font-medium">Subir imagen o video</span>
                    <span className="text-xs mt-1">Formatos: JPG, PNG, GIF, MP4, WEBM</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="space-y-6">
            {/* Name & Age */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm text-muted-foreground">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Sofia"
                  className="w-full px-4 py-3 rounded-lg bg-muted input-dark text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Edad</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ej: 22"
                  className="w-full px-4 py-3 rounded-lg bg-muted input-dark text-sm"
                />
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Descripción Corta (Tagline)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Tu vecina amigable que siempre necesita azúcar..."
                className="w-full px-4 py-3 rounded-lg bg-muted input-dark text-sm"
              />
            </div>

            {/* AI Generate Button - Always visible, enabled only with image */}
            <button
              onClick={generateStoryWithAI}
              disabled={generatingStory || !mediaUrl}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg flex items-center justify-center gap-3"
            >
              {generatingStory ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analizando imagen...
                </>
              ) : !mediaUrl ? (
                <>
                  <Wand2 className="h-5 w-5" />
                  Sube una imagen o video para generar con IA
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  {mediaType === 'video'
                    ? '✨ Generar Historia desde Video'
                    : `✨ Generar Historia con IA ${isAnimatedImage ? '(GIF)' : ''}`}
                </>
              )}
            </button>

            {/* History/Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">
                  Descripción & Personalidad (PROMPT)
                </label>
                {mediaUrl && (
                  <button 
                    onClick={generateStoryWithAI}
                    disabled={generatingStory}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/20 text-primary text-xs hover:bg-primary/30 disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    {generatingStory ? 'Generando...' : 'Generar con IA'}
                  </button>
                )}
              </div>
              <textarea
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                rows={4}
                placeholder="[Prompt del Sistema] Describe cómo actúa, qué secretos tiene, y el escenario. Ejemplo: Eres María, una profesora estricta..."
                className="w-full px-4 py-3 rounded-lg bg-muted input-dark text-sm resize-none"
              />
            </div>

            {/* Welcome Message */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">
                  Mensaje de Bienvenida (El Inicio)
                </label>
                <span className="px-1.5 py-0.5 rounded text-xs bg-primary/20 text-primary">
                  PÚBLICO
                </span>
              </div>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                placeholder="Escribe lo primero que dirá el personaje. Ejemplo: *Te mira con desafío* ¿Qué haces aquí tan tarde?"
                className="w-full px-4 py-3 rounded-lg bg-muted input-dark text-sm resize-none"
              />
            </div>

            {/* NSFW Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-destructive">
                    Contenido NSFW (+18)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Permite interacciones adultas, explícitas y sin filtros/límites.
                  </p>
                </div>
              </div>
              <Switch
                checked={nsfw}
                onCheckedChange={setNsfw}
              />
            </div>

            {/* Voice Selection */}
            <div className="space-y-3">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <span>Configuración de Voz (Latino)</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Selecciona el acento y tono de voz de tu personaje.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {VOICE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setVoice(option.id)}
                    className={cn(
                      'voice-chip text-left p-3',
                      voice === option.id && 'voice-chip-active'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">
                        {option.icon}
                      </span>
                      <span className={cn(
                        'font-medium text-sm',
                        voice === option.id ? 'text-primary' : 'text-foreground'
                      )}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {option.description}
                    </p>
                    <button className="mt-2 text-xs text-primary hover:underline">
                      🎧 Escuchar muestra
                    </button>
                  </button>
                ))}
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={loading || !name || !age || !history || !tagline || !welcomeMessage}
              className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-glow flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Personaje'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateCharacterPage;
