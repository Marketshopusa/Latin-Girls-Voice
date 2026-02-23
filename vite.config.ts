import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // Garantiza que la web cargue /registerSW.js y registre el SW (PWABuilder lo detecta)
      injectRegister: "script",
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png", "characters/*.jpg", "characters/*.webp", "characters/*.gif", "characters/*.mp4"],
      manifest: {
        name: "Latin Girls Voice",
        short_name: "LGV",
        description: "Chat con personajes virtuales de IA - Compañeras latinas virtuales",
        theme_color: "#d4af37",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "es",
        dir: "ltr",
        categories: ["entertainment", "social"],
        icons: [
          {
            src: "/icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        screenshots: [
          {
            src: "/screenshots/screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide"
          },
          {
            src: "/screenshots/screenshot-narrow.png",
            sizes: "720x1280",
            type: "image/png",
            form_factor: "narrow"
          }
        ],
        shortcuts: [
          {
            name: "Descubrir",
            short_name: "Descubrir",
            url: "/discover",
            icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }]
          },
          {
            name: "Mensajes",
            short_name: "Mensajes",
            url: "/messages",
            icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }]
          },
          {
            name: "Suscripción",
            short_name: "Premium",
            url: "/subscription",
            icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }]
          }
        ]
      },
      workbox: {
        // Clean old caches on activate to ensure updates appear immediately
        cleanupOutdatedCaches: true,
        // Skip waiting so new SW takes control immediately
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        globIgnores: ["**/characters/**", "**/intro/**"],
        // CRITICAL: Exclude OAuth broker paths from service worker navigation fallback
        // so the server can handle /~oauth/initiate redirects for Google login
        navigateFallbackDenylist: [/^\/~oauth/, /^\/~/, /^\/api/, /^\/auth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          },
          {
            urlPattern: /\/characters\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "characters-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
