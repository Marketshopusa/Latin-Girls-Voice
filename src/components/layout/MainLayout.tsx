import { Sidebar } from '@/components/layout/Sidebar';
import { MobileTopNav } from '@/components/layout/MobileTopNav';
import { Outlet, Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const SiteFooter = () => (
  <footer className="w-full border-t border-border bg-muted/30 py-4 px-4">
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-2 text-center">
      <div className="flex items-center gap-4">
        <Link
          to="/privacy"
          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
        >
          Política de Privacidad
        </Link>
        <Link
          to="/terms"
          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
        >
          Términos de Servicio
        </Link>
      </div>
      <p className="text-xs text-muted-foreground leading-snug max-w-md">
        Latin Girls Voice utiliza la autenticación de Google para permitir a los usuarios gestionar sus perfiles y voces de IA de forma segura.
      </p>
      <p className="text-xs text-muted-foreground leading-snug max-w-lg mt-1">
        Latin Girls Voice es una aplicación de entretenimiento sintético de uso individual. No existe interacción, chat ni intercambio de información entre usuarios. Los datos de generación son privados y aislados.
      </p>
      <p className="text-[10px] text-muted-foreground/60">
        © {new Date().getFullYear()} Synthetic Digital Labs · info@latingirlsvoice.com
      </p>
    </div>
  </footer>
);

export const MainLayout = () => {
  const isMobile = useIsMobile();

  // Mobile: top nav bar
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <MobileTopNav />
        <main className="flex-1 pt-14">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Desktop: sidebar layout
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-16 lg:ml-56 flex flex-col min-h-screen">
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
};
