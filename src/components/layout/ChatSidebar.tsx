import { Home, MessageCircle, Mail, Settings, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Descubrir', href: '/', icon: Home },
  { name: 'Mensajes', href: '/messages', icon: MessageCircle },
  { name: 'Correo', href: '/mail', icon: Mail },
];

export const ChatSidebar = () => {
  const location = useLocation();

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
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          title="Usuario"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">W</span>
          </div>
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
