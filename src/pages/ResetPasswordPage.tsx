import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const ResetPasswordPage = () => {
  const { updatePassword, session } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    try {
      setIsSubmitting(true);
      await updatePassword(password);
      toast.success('¡Contraseña actualizada exitosamente!');
      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session && !isRecovery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-4">
        <h2 className="text-xl font-bold">Enlace inválido o expirado</h2>
        <p className="text-muted-foreground">Solicita un nuevo enlace de recuperación.</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90">
          Ir al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-4">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-2">
        <span className="text-4xl">🔑</span>
      </div>
      <h2 className="text-xl font-display font-bold">Nueva contraseña</h2>
      <p className="text-muted-foreground max-w-sm">Ingresa tu nueva contraseña para continuar.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
          {isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
