import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marketshopusa.latingirlsvoice',
  appName: 'Latin Girls Voice',
  webDir: 'dist',
  // NO server.url — the app loads 100% from local files in dist/
  // This makes the app fully autonomous on the device.
  android: {
    // Only allow Google and Supabase domains for the OAuth flow itself.
    // Lovable/preview domains are NOT included so the redirect to our
    // custom scheme triggers Android's intent-filter instead of loading
    // a remote page inside the WebView.
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
      '*.supabase.co'
    ]
  }
};

export default config;
