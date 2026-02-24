import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marketshopusa.latingirlsvoice',
  appName: 'Latin Girls Voice',
  webDir: 'dist',
  // NO server.url — the app loads 100% from local files in dist/
  // This makes the app fully autonomous on the device.
  android: {
    // Allow OAuth-related domains to open inside the WebView
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      'oauth.lovable.app',
      '*.lovableproject.com',
      '*.lovable.app',
      '*.supabase.co'
    ]
  }
};

export default config;
