import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;

    // Check if this is an OAuth callback or auth-related redirect
    const isAuthRelated =
      path.includes('oauth') ||
      path.includes('auth') ||
      path.includes('callback') ||
      path.startsWith('/~') ||
      hash.includes('access_token') ||
      hash.includes('refresh_token') ||
      search.includes('access_token') ||
      search.includes('code=');

    if (isAuthRelated) {
      console.log('Auth-related 404 detected, redirecting to home:', path);
      setRedirecting(true);
      // Give Supabase a moment to process any tokens in the URL
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
      return;
    }

    console.error("404 Error: User attempted to access non-existent route:", path);
  }, [location.pathname, navigate]);

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Página no encontrada</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
