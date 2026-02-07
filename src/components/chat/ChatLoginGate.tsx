import { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatLoginGateProps {
  characterName: string;
  onBack: () => void;
}

export const ChatLoginGate = ({ characterName, onBack }: ChatLoginGateProps) => {
  const { signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error from chat gate:', error);
      toast.error('Error al iniciar sesión. Intenta de nuevo.');
      setIsSigningIn(false);
    }
    // Don't reset isSigningIn on success - page will redirect/re-render
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-4">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-2">
        <span className="text-4xl">🔒</span>
      </div>
      <h2 className="text-xl font-display font-bold">Inicia sesión para chatear</h2>
      <p className="text-muted-foreground max-w-sm">
        Necesitas una cuenta para conversar con {characterName}. 
        ¡Es gratis y solo toma unos segundos!
      </p>
      <div className="flex flex-col gap-3 mt-2 w-full max-w-xs">
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSigningIn ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          {isSigningIn ? 'Conectando...' : 'Iniciar sesión con Google'}
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  );
};
