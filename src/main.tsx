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

createRoot(document.getElementById("root")!).render(<App />);
