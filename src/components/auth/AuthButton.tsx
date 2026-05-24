import { useState } from 'react';
import { LogIn, LogOut, Loader2, User, Mail, Eye, EyeOff, UserPlus, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ButtonProps } from '@/components/ui/button';

type ViewMode = 'login' | 'register' | 'forgot';

interface AuthButtonProps {
  className?: string;
  showLabel?: boolean;
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  title?: string;
}

export const AuthButton = ({
  className,
  showLabel = true,
  buttonVariant = 'outline',
  buttonSize = 'default',
  title,
}: AuthButtonProps) => {
  const { user, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
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
    if (!password) e.password = 'La contraseña es obligatoria';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (viewMode === 'register' && password !== confirmPassword) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setShowPassword(false);
  };

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    resetForm();
  };

  const handleEmailLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setIsSigningIn(true);
      await signInWithEmail(email, password);
      setShowDialog(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || 'Error al iniciar sesión');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRegister = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setIsSigningIn(true);
      await signUpWithEmail(email, password);
      toast.success('¡Bienvenido! Tu cuenta ha sido creada.');
      setShowDialog(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear la cuenta');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setShowDialog(false);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Error al iniciar sesión con Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  if (isLoading) {
    return (
      <Button variant={buttonVariant} size={buttonSize} className={className} disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
        {showLabel && <span className="hidden sm:inline">Cargando...</span>}
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          onClick={() => { setViewMode('login'); setShowDialog(true); }}
          variant={buttonVariant}
          size={buttonSize}
          className={cn('gap-2', className)}
          title={title}
        >
          <LogIn className="h-4 w-4" />
          {showLabel && <span className="hidden sm:inline">Iniciar sesión</span>}
        </Button>

        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[380px] p-6 gap-0 border-border bg-background">
            <div className="flex flex-col items-center text-center mb-5">
              <h2 className="text-lg font-display font-bold">
                {viewMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {viewMode === 'login' ? 'Accede a tus conversaciones' : 'Regístrate gratis para empezar'}
              </p>
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50 mb-4"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">o</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email form */}
            <form onSubmit={viewMode === 'login' ? handleEmailLogin : handleRegister} className="flex flex-col gap-3">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoComplete="email"
                />
                {errors.email && <span className="text-xs text-destructive mt-1">{errors.email}</span>}
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    autoComplete={viewMode === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <span className="text-xs text-destructive mt-1">{errors.password}</span>}
              </div>

              {viewMode === 'register' && (
                <div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    autoComplete="new-password"
                  />
                  {errors.confirm && <span className="text-xs text-destructive mt-1">{errors.confirm}</span>}
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : viewMode === 'register' ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Crear cuenta
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Entrar
                  </>
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="text-center mt-4">
              {viewMode === 'login' ? (
                <button onClick={() => switchView('register')} className="text-sm text-muted-foreground">
                  ¿No tienes cuenta? <span className="text-primary hover:underline">Regístrate</span>
                </button>
              ) : (
                <button onClick={() => switchView('login')} className="text-sm text-muted-foreground">
                  ¿Ya tienes cuenta? <span className="text-primary hover:underline">Inicia sesión</span>
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize} className={cn('gap-2 px-2', className)} title={title}>
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          {showLabel && (
            <span className="hidden sm:inline max-w-[120px] truncate">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
