import { AlertTriangle } from 'lucide-react';

interface AgeConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AgeConfirmModal = ({ isOpen, onConfirm, onCancel }: AgeConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-surface-overlay/90 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-destructive/50 rounded-xl overflow-hidden animate-fade-in mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-destructive/10 border-b border-destructive/30">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-destructive">
              Contenido para Adultos
            </h2>
            <p className="text-sm text-muted-foreground">
              Verificación de edad requerida
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-foreground">
            Estás a punto de activar el <strong className="text-destructive">Modo NSFW (+18)</strong>. 
            Este contenido incluye material explícito para adultos.
          </p>
          
          <div className="p-4 rounded-lg bg-muted border border-border">
            <p className="text-sm text-muted-foreground">
              Al continuar, confirmas que:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              <li>• Tienes 18 años o más</li>
              <li>• Aceptas ver contenido explícito sin censura</li>
              <li>• Es legal ver este contenido en tu país</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg bg-muted text-foreground font-medium hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
          >
            Soy Mayor de 18
          </button>
        </div>
      </div>
    </div>
  );
};
