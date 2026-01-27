import { Home, MessageCircle, Plus, CreditCard, Settings, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Descubrir', href: '/', icon: Home },
  { name: 'Mensajes', href: '/messages', icon: MessageCircle },
  { name: 'Crear Personaje', href: '/create', icon: Plus },
  { name: 'Recargar', href: '/credits', icon: CreditCard },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-16 lg:w-56 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-sidebar-border">
        <h1 className="text-xl font-display font-bold text-primary glow-text hidden lg:block">
          MATE
        </h1>
        <span className="text-xl font-display font-bold text-primary glow-text lg:hidden">M</span>
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

      {/* Footer */}
      <div className="p-2 lg:p-4 border-t border-sidebar-border space-y-1">
        <button className="sidebar-item w-full justify-center lg:justify-start">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">W</span>
          </div>
          <span className="hidden lg:block">Will</span>
        </button>
        
        <button className="sidebar-item w-full justify-center lg:justify-start">
          <Settings className="h-5 w-5" />
          <span className="hidden lg:block">Contáctanos</span>
        </button>

        <button className="sidebar-item w-full justify-center lg:justify-start">
          <Globe className="h-5 w-5" />
          <span className="hidden lg:block">Español</span>
        </button>
      </div>
    </aside>
  );
};
