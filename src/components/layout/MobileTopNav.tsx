import { useState } from 'react';
import { Home, MessageCircle, Plus, Crown, Shield, LogIn, LogOut, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNsfw } from '@/contexts/NsfwContext';
import { useAuth } from '@/contexts/AuthContext';
import { AgeConfirmModal } from '@/components/modals/AgeConfirmModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const navigation = [
  { name: 'Descubrir', href: '/', icon: Home },
  { name: 'Mensajes', href: '/messages', icon: MessageCircle },
  { name: 'Crear', href: '/create', icon: Plus },
  { name: 'Premium', href: '/subscription', icon: Crown },
];

export const MobileTopNav = () => {
  const location = useLocation();
  const { nsfwEnabled, toggleNsfw, hasConfirmedAge, confirmAge } = useNsfw();
  const { user, isLoading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleNsfwToggle = () => {
    if (!nsfwEnabled && !hasConfirmedAge) {
      setShowAgeModal(true);
    } else {
      toggleNsfw();
    }
  };

  const handleAgeConfirm = () => {
    confirmAge();
    toggleNsfw();
    setShowAgeModal(false);
  };

  const handleAuth = async () => {
    if (user) {
      try {
        await signOut();
        toast.success('Sesión cerrada');
      } catch {
        toast.error('Error al cerrar sesión');
      }
    } else {
      try {
        setIsSigningIn(true);
        await signInWithGoogle();
        // If we reach here without redirect, show message
        // (signInWithGoogle may redirect the page, so this may not execute)
      } catch (error: any) {
        console.error('Mobile sign in error:', error);
        const msg = error?.message || 'Error al iniciar sesión';
        if (msg.includes('Popup was blocked') || msg.includes('cancelled')) {
          toast.error('No se pudo abrir la ventana de inicio de sesión', {
            description: 'Intenta de nuevo o usa un navegador diferente.',
          });
        } else {
          toast.error('Error al iniciar sesión', { description: msg });
        }
      } finally {
        setIsSigningIn(false);
      }
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-14 px-3">
          {/* Logo */}
          <h1 className="text-lg font-display font-bold logo-3d-gold">
            Latin Girls Voice
          </h1>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-primary/20 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                  title={item.name}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              );
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-1">
            {/* NSFW Toggle */}
            <button
              onClick={handleNsfwToggle}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                nsfwEnabled 
                  ? 'bg-destructive/20 text-destructive' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
              title={nsfwEnabled ? 'NSFW activo' : 'Activar NSFW'}
            >
              <Shield className="h-5 w-5" />
            </button>

            {/* Auth button */}
            <button
              onClick={handleAuth}
              disabled={authLoading || isSigningIn}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              title={user ? 'Mi cuenta' : 'Iniciar sesión'}
            >
              {authLoading || isSigningIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : user ? (
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <LogIn className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <AgeConfirmModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={() => setShowAgeModal(false)}
      />
    </>
  );
};
