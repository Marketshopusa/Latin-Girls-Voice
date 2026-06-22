import { useState } from 'react';
import { LogIn, Loader2, Mail, UserPlus, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatLoginGateProps {
  characterName: string;
  onBack: () => void;
}

type ViewMode = 'login' | 'register' | 'forgot';

export const ChatLoginGate = ({ characterName, onBack }: ChatLoginGateProps) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'El email es obligatorio';
    else if (!validateEmail(email)) e.email = 'Formato de email inválido';
    if (viewMode !== 'forgot') {
      if (!password) e.password = 'La contraseña es obligatoria';
      else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    }
    if (viewMode === 'register') {
      if (password !== confirmPassword) e.confirm = 'Las contraseñas no coinciden';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      await signInWithEmail(email, password);
    } catch (err: any) {
      toast.error(err?.message || 'Error al iniciar sesión');
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const result = await signUpWithEmail(email, password);
      if (result.needsConfirmation) {
        toast.success('¡Cuenta creada! Revisa tu email para confirmar.');
        setViewMode('login');
      } else {
        toast.success('¡Cuenta creada exitosamente!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value.trim().toLowerCase());
  };

  const handleForgotPassword = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      await resetPassword(email);
      toast.success('¡Email enviado! Revisa tu bandeja para restablecer tu contraseña.');
      setViewMode('login');
    } catch (err: any) {
      toast.error(err?.message || 'Error al enviar el email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      await signInWithGoogle();
    } catch {
      toast.error('Error al iniciar sesión con Google.');
      setIsSubmitting(false);
    }
  };

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  const title = viewMode === 'login' ? 'Iniciar sesión' : viewMode === 'register' ? 'Crear cuenta' : 'Recuperar contraseña';
  const icon = viewMode === 'forgot' ? '🔑' : viewMode === 'register' ? '✨' : '🔒';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-4">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-2">
        <span className="text-4xl">{icon}</span>
      </div>
      <h2 className="text-xl font-display font-bold">{title}</h2>
      <p className="text-muted-foreground max-w-sm">
        {viewMode === 'forgot'
          ? 'Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.'
          : viewMode === 'register'
            ? `Regístrate para conversar con ${characterName}. ¡Es gratis!`
            : `Inicia sesión para conversar con ${characterName}.`}
      </p>

      <div className="flex flex-col gap-3 mt-2 w-full max-w-xs">
        {/* Email form — always shown as primary */}
        <form onSubmit={viewMode === 'login' ? handleLogin : viewMode === 'register' ? handleRegister : handleForgotPassword} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 text-left">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoComplete="email"
            />
            {errors.email && <span className="text-xs text-destructive">{errors.email}</span>}
          </div>

          {viewMode !== 'forgot' && (
            <div className="flex flex-col gap-1 text-left">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={viewMode === 'register' ? 'Contraseña (mín. 6 caracteres)' : 'Contraseña'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoComplete={viewMode === 'register' ? 'new-password' : 'current-password'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-destructive">{errors.password}</span>}
            </div>
          )}

          {viewMode === 'register' && (
            <div className="flex flex-col gap-1 text-left">
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="new-password"
              />
              {errors.confirm && <span className="text-xs text-destructive">{errors.confirm}</span>}
            </div>
          )}

          {viewMode === 'login' && (
            <button type="button" onClick={() => switchView('forgot')} className="text-xs text-primary hover:underline text-right -mt-1">
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : viewMode === 'forgot' ? <KeyRound className="h-5 w-5" /> : viewMode === 'register' ? <UserPlus className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            {isSubmitting
              ? 'Procesando...'
              : viewMode === 'forgot'
                ? 'Enviar enlace'
                : viewMode === 'register'
                  ? 'Crear cuenta'
                  : 'Entrar'}
          </button>
        </form>

        {/* Google as secondary */}
        {viewMode !== 'forgot' && (
          <>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <div className="flex-1 h-px bg-border" />
              <span>o</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <LogIn className="h-5 w-5" />
              Continuar con Google
            </button>
          </>
        )}

        {/* Toggle links */}
        {viewMode === 'login' && (
          <button onClick={() => switchView('register')} className="text-sm text-primary hover:underline mt-1">
            ¿No tienes cuenta? Regístrate aquí
          </button>
        )}
        {viewMode === 'register' && (
          <button onClick={() => switchView('login')} className="text-sm text-primary hover:underline mt-1">
            ¿Ya tienes cuenta? Inicia sesión aquí
          </button>
        )}
        {viewMode === 'forgot' && (
          <button onClick={() => switchView('login')} className="text-sm text-primary hover:underline mt-1">
            Volver al inicio de sesión
          </button>
        )}

        <button onClick={onBack} className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">
          Volver
        </button>
      </div>
    </div>
  );
};
