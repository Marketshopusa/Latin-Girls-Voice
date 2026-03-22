import { useState } from 'react';
import { Home, MessageCircle, Plus, Crown, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNsfw } from '@/contexts/NsfwContext';
import { AgeConfirmModal } from '@/components/modals/AgeConfirmModal';
import { AuthButton } from '@/components/auth/AuthButton';

const navigation = [
  { name: 'Descubrir', href: '/', icon: Home },
  { name: 'Mensajes', href: '/messages', icon: MessageCircle },
  { name: 'Crear', href: '/create', icon: Plus },
  { name: 'Premium', href: '/subscription', icon: Crown },
];

export const MobileTopNav = () => {
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
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-14 px-3">
          {/* Logo + Privacy link */}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-display font-bold logo-3d-gold">
              Latin Girls Voice
            </h1>
            <a
              href="/privacy"
              className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              Privacidad
            </a>
          </div>

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
            {/* NSFW Toggle - only visible when feature is enabled */}
            {featureVisible && (
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
            )}

            {/* Auth button */}
            <AuthButton
              showLabel={false}
              buttonVariant="ghost"
              buttonSize="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              title="Iniciar sesión"
            />
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
