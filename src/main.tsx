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
        // The URL may arrive as:
        //   com.marketshopusa.latingirlsvoice://google-auth#access_token=...&refresh_token=...
        //   com.marketshopusa.latingirlsvoice://google-auth?code=...
        const hashPart = event.url.split('#')[1] || '';
        const queryPart = (event.url.split('?')[1] || '').split('#')[0];

        const hashParams = new URLSearchParams(hashPart);
        const queryParams = new URLSearchParams(queryPart);

        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const code = queryParams.get('code') || hashParams.get('code');

        if (accessToken && refreshToken) {
          console.log('[Capacitor] Tokens found in deep link, restoring session...');
          sessionStorage.setItem('__cap_oauth_access_token', accessToken);
          sessionStorage.setItem('__cap_oauth_refresh_token', refreshToken);
          window.location.hash = '';
          window.location.reload();
        } else if (code) {
          console.log('[Capacitor] Auth code found in deep link, exchanging...');
          sessionStorage.setItem('__cap_oauth_code', code);
          window.location.reload();
        } else {
          console.warn('[Capacitor] Deep link received but no tokens or code found:', event.url);
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
