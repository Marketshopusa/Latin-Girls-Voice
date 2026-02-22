import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marketshopusa.latingirlsvoice',
  appName: 'Latin Girls Voice',
  webDir: 'dist',
  server: {
    url: 'https://8cead4c7-fb5e-4e17-9a86-9761e6432b0f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
