import { useState } from 'react';
import { Home, MessageCircle, Plus, Crown, Shield, LogIn, LogOut, Loader2, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { useNsfw } from '@/contexts/NsfwContext';
import { useAuth } from '@/contexts/AuthContext';
import { AgeConfirmModal } from '@/components/modals/AgeConfirmModal';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const navigation = [
  { name: 'Descubrir', href: '/', icon: Home },
  { name: 'Mensajes', href: '/messages', icon: MessageCircle },
  { name: 'Crear Personaje', href: '/create', icon: Plus },
  { name: 'Suscripción', href: '/subscription', icon: Crown },
];

export const Sidebar = () => {
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
      } catch {
        toast.error('Error al iniciar sesión');
      } finally {
        setIsSigningIn(false);
      }
    }
  };

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-16 lg:w-56 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 lg:px-6 border-b border-sidebar-border">
          <h1 className="text-xl font-display font-bold hidden lg:block logo-3d-gold">
            Latin Girls Voice
          </h1>
          <span className="text-xl font-display font-bold lg:hidden logo-3d-gold">LGV</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'sidebar-item justify-center lg:justify-start',
                  isActive && 'sidebar-item-active'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden lg:block">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* QR Code Section */}
        <div className="hidden lg:flex flex-col items-center justify-center flex-1 px-4 py-6">
          <div className="bg-white p-3 rounded-xl shadow-lg">
            <QRCodeSVG
              value="https://latingirlsvoice.com"
              size={120}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3 leading-relaxed">
            📱 Escanea el código y disfruta tu APP en tu celular
          </p>
        </div>

        {/* Footer */}
        <div className="p-2 lg:p-4 border-t border-sidebar-border space-y-1">
          {/* NSFW Toggle */}
          <div className="p-2 lg:p-3 rounded-lg bg-muted/50 border border-border">
            <button 
              onClick={handleNsfwToggle}
              className="w-full flex items-center gap-2 justify-center lg:justify-between"
            >
              <div className="flex items-center gap-2">
                <Shield className={cn(
                  "h-5 w-5 transition-colors",
                  nsfwEnabled ? "text-destructive" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "hidden lg:block text-sm font-medium",
                  nsfwEnabled ? "text-destructive" : "text-muted-foreground"
                )}>
                  NSFW +18
                </span>
              </div>
              <Switch
                checked={nsfwEnabled}
                onCheckedChange={handleNsfwToggle}
                className="hidden lg:flex"
              />
            </button>
            {nsfwEnabled && (
              <p className="hidden lg:block text-xs text-destructive/70 mt-1.5">
                Contenido adulto activado
              </p>
            )}
          </div>

          <button 
            onClick={handleAuth}
            disabled={authLoading || isSigningIn}
            className="sidebar-item w-full justify-center lg:justify-start"
          >
            {authLoading || isSigningIn ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="hidden lg:block">Cargando...</span>
              </>
            ) : user ? (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:block truncate max-w-[100px]">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span className="hidden lg:block">Iniciar sesión</span>
              </>
            )}
          </button>
          
          {/* Políticas */}
          <div className="p-2 lg:p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 justify-center lg:justify-start mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="hidden lg:block text-xs font-medium text-muted-foreground uppercase tracking-wider">Políticas</span>
            </div>
            <div className="hidden lg:flex flex-col gap-0.5">
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-muted">
                Privacidad
              </Link>
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-muted">
                Términos de Servicio
              </Link>
              <Link to="/age-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-muted">
                Verificación de Edad
              </Link>
            </div>
            <Link to="/privacy" className="lg:hidden flex justify-center">
              <span className="text-[10px] text-muted-foreground">Políticas</span>
            </Link>
          </div>
        </div>
      </aside>

      <AgeConfirmModal
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onCancel={() => setShowAgeModal(false)}
      />
    </>
  );
};
