import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Detect Capacitor native environment
const isCapacitor = !!(window as any).Capacitor;

if ('serviceWorker' in navigator) {
  if (isCapacitor) {
    // In a native Capacitor app with local files, Service Workers are unnecessary.
    // Unregister ALL existing SWs immediately.
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        reg.unregister().then(() => {
          console.log('[Capacitor] Service Worker unregistered:', reg.scope);
        });
      });
    });

    // Block VitePWA's auto-register from re-creating the SW.
    navigator.serviceWorker.register = (() => {
      console.log('[Capacitor] SW registration blocked — not needed in native app');
      return Promise.resolve({} as ServiceWorkerRegistration);
    }) as any;
  } else {
    // For web browsers: update existing SWs to get latest code
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        reg.update().catch(() => {});
      });
    });
  }
}

// Deep link handling for native OAuth callback
if (isCapacitor) {
  import('@capacitor/app').then(({ App: CapApp }) => {
    CapApp.addListener('appUrlOpen', (event) => {
      console.log('[Capacitor] Deep link received:', event.url);

      try {
        const url = new URL(event.url);
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          // Store tokens temporarily for AuthContext to pick up
          sessionStorage.setItem('__cap_oauth_access_token', accessToken);
          sessionStorage.setItem('__cap_oauth_refresh_token', refreshToken);
          // Navigate to root to trigger session restoration
          window.location.hash = '';
          window.location.pathname = '/';
          window.location.reload();
        } else {
          // Check for code in query params
          const code = url.searchParams.get('code');
          if (code) {
            sessionStorage.setItem('__cap_oauth_code', code);
            window.location.reload();
          }
        }
      } catch (e) {
        console.error('[Capacitor] Error processing deep link:', e);
      }
    });
  }).catch(err => {
    console.warn('[Capacitor] Could not load @capacitor/app:', err);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
