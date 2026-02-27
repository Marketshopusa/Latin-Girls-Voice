import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.syntheticdigitallabs.latingirlsvoice',
  appName: 'Latin Girls Voice',
  webDir: 'dist',
  server: {
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
      '*.supabase.co',
      'mwrahnkynhfulzkljeqs.supabase.co'
    ]
  }
};

export default config;
