import { useState } from 'react';
import { Home, MessageCircle, Plus, Crown, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { useNsfw } from '@/contexts/NsfwContext';
import { AgeConfirmModal } from '@/components/modals/AgeConfirmModal';
import { Switch } from '@/components/ui/switch';
import { AuthButton } from '@/components/auth/AuthButton';

const navigation = [
  { name: 'Descubrir', href: '/', icon: Home },
  { name: 'Mensajes', href: '/messages', icon: MessageCircle },
  { name: 'Crear Personaje', href: '/create', icon: Plus },
  { name: 'Suscripción', href: '/subscription', icon: Crown },
];

export const Sidebar = () => {
  const location = useLocation();
  const { nsfwEnabled, toggleNsfw, hasConfirmedAge, confirmAge, featureVisible } = useNsfw();
  const [showAgeModal, setShowAgeModal] = useState(false);

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
          {/* NSFW Toggle - only visible when feature is enabled */}
          {featureVisible && (
            <div className="p-2 lg:p-3 rounded-lg bg-muted/50 border border-border">
              <div className="w-full flex items-center gap-2 justify-center lg:justify-between">
                <button
                  type="button"
                  onClick={handleNsfwToggle}
                  className="flex items-center gap-2 rounded-lg transition-colors hover:text-foreground"
                  title={nsfwEnabled ? 'Desactivar Plus +18' : 'Activar Plus +18'}
                >
                  <Shield className={cn(
                    "h-5 w-5 transition-colors",
                    nsfwEnabled ? "text-destructive" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "hidden lg:block text-sm font-medium",
                    nsfwEnabled ? "text-destructive" : "text-muted-foreground"
                  )}>
                    Plus +18
                  </span>
                </button>
                <Switch
                  checked={nsfwEnabled}
                  onCheckedChange={handleNsfwToggle}
                  className="hidden lg:flex"
                />
              </div>
              {nsfwEnabled && (
                <p className="hidden lg:block text-xs text-destructive/70 mt-1.5">
                  Modo Plus activado
                </p>
              )}
            </div>
          )}

          <AuthButton
            buttonVariant="ghost"
            className="sidebar-item w-full justify-center lg:justify-start"
            title="Iniciar sesión"
          />
          

          {/* Google Auth purpose */}
          <p className="hidden lg:block text-[10px] text-muted-foreground/60 text-center px-2 leading-tight">
            Latin Girls Voice utiliza la autenticación de Google para permitir a los usuarios gestionar sus perfiles y voces de IA de forma segura.
          </p>
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
