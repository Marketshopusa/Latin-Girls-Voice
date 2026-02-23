import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marketshopusa.latingirlsvoice',
  appName: 'Latin Girls Voice',
  webDir: 'dist',
  server: {
    url: 'https://8cead4c7-fb5e-4e17-9a86-9761e6432b0f.lovableproject.com?forceHideBadge=true',
    cleartext: true,
    // Allow OAuth-related domains to stay inside the WebView
    // instead of opening in the system browser (which breaks the token flow)
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      'oauth.lovable.app',
      '*.lovableproject.com',
      '*.lovable.app'
    ]
  }
};

export default config;
