import { Sidebar } from '@/components/layout/Sidebar';
import { Outlet } from 'react-router-dom';

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 lg:ml-56">
        <Outlet />
      </main>
    </div>
  );
};
