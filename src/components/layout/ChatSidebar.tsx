import { useState } from 'react';
import { Home, MessageCircle, Mail, Settings, Globe, LogIn, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const navigation = [
  { name: 'Descubrir', href: '/', icon: Home },
  { name: 'Mensajes', href: '/messages', icon: MessageCircle },
  { name: 'Correo', href: '/mail', icon: Mail },
];

export const ChatSidebar = () => {
  const location = useLocation();
  const { user, isLoading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

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
    <aside className="w-14 bg-sidebar border-r border-sidebar-border flex flex-col h-screen flex-shrink-0">
      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                isActive && 'bg-primary/20 text-primary'
              )}
              title={item.name}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button 
          onClick={handleAuth}
          disabled={authLoading || isSigningIn}
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          title={user ? user.user_metadata?.full_name || 'Usuario' : 'Iniciar sesión'}
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
        
        <button 
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          title="Contáctanos"
        >
          <Settings className="h-5 w-5" />
        </button>

        <button 
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          title="Idioma"
        >
          <Globe className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
};
