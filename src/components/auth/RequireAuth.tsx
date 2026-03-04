import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatLoginGate } from '@/components/chat/ChatLoginGate';
import { useNavigate } from 'react-router-dom';

interface RequireAuthProps {
  children: ReactNode;
  pageName?: string;
}

export const RequireAuth = ({ children, pageName = 'esta sección' }: RequireAuthProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <ChatLoginGate characterName={pageName} onBack={() => navigate('/')} />;
  }

  return <>{children}</>;
};
