import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { restorePersistedSession } from '@/contexts/auth/sessionPersistence';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    let isActive = true;

    const finalizeCallback = async () => {
      try {
        await restorePersistedSession();
      } catch (error) {
        console.error('[AuthCallback] Failed to restore session:', error);
      }

      if (!isActive || isLoading) return;
      navigate(user ? '/messages' : '/', { replace: true });
    };

    void finalizeCallback();

    return () => {
      isActive = false;
    };
  }, [isLoading, navigate, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}