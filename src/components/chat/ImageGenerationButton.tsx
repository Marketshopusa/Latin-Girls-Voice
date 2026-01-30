import { Image, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: Date;
}

interface ImageGenerationButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
  lastGeneratedImage: GeneratedImage | null;
  onClearImage: () => void;
  disabled?: boolean;
  isMobile?: boolean;
}

export const ImageGenerationButton = ({
  onGenerate,
  isGenerating,
  lastGeneratedImage,
  onClearImage,
  disabled,
  isMobile,
}: ImageGenerationButtonProps) => {
  const [showImageDialog, setShowImageDialog] = useState(false);

  const handleClick = () => {
    if (lastGeneratedImage) {
      setShowImageDialog(true);
    } else {
      onGenerate();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isGenerating}
        className={cn(
          "flex items-center justify-center rounded-full transition-all",
          isMobile ? "w-10 h-10" : "w-10 h-10",
          lastGeneratedImage
            ? "bg-primary/20 text-primary"
            : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80",
          (disabled || isGenerating) && "opacity-50 cursor-not-allowed"
        )}
        title={lastGeneratedImage ? "Ver imagen generada" : "Generar imagen"}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Image className="h-4 w-4" />
        )}
      </button>

      {/* Dialog para mostrar imagen generada */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Imagen Generada
              <button
                onClick={() => {
                  onClearImage();
                  setShowImageDialog(false);
                }}
                className="p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          {lastGeneratedImage && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-secondary">
                <img
                  src={lastGeneratedImage.url}
                  alt="Imagen generada"
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Prompt utilizado:</p>
                <p className="italic">{lastGeneratedImage.prompt}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="flex-1 py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? 'Generando...' : 'Generar otra'}
                </button>
                <a
                  href={lastGeneratedImage.url}
                  download="imagen-generada.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  Descargar
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
