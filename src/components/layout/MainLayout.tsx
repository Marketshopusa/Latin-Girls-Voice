import { Sidebar } from '@/components/layout/Sidebar';
import { MobileTopNav } from '@/components/layout/MobileTopNav';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export const MainLayout = () => {
  const isMobile = useIsMobile();

  // Mobile: top nav bar
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <MobileTopNav />
        {/* pt-14 to account for fixed header height */}
        <main className="flex-1 pt-14">
          <Outlet />
        </main>
      </div>
    );
  }

  // Desktop: sidebar layout
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 lg:ml-56">
        <Outlet />
      </main>
    </div>
  );
};
