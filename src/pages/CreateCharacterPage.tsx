import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Volume2, Shield, Sparkles, Loader2 } from 'lucide-react';
import { VOICE_OPTIONS, VoiceType } from '@/types';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useCreateCharacter } from '@/hooks/useCharacters';
import { toast } from 'sonner';

const CreateCharacterPage = () => {
  const navigate = useNavigate();
  const { createCharacter, loading, error } = useCreateCharacter();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [tagline, setTagline] = useState('');
  const [history, setHistory] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [voice, setVoice] = useState<VoiceType>('COLOMBIANA_PAISA');
  const [nsfw, setNsfw] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      setMediaType(isVideo ? 'video' : 'image');
      
      const reader = new FileReader();
      reader.onload = () => setMediaUrl(reader.result as string);
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

            {/* History/Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">
                  Descripción & Personalidad (PROMPT)
                </label>
                <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/20 text-primary text-xs">
                  <Sparkles className="h-3 w-3" />
                  Generar con IA
                </button>
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
                      <span className="text-xs font-medium bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                        {option.country}
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
