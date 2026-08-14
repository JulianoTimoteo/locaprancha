import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo-pitangueiras.png", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Locaprancha",
        short_name: "Locaprancha",
        description: "Sistema de Gestão de Frota e Pranchas - Usina Pitangueiras",
        theme_color: "#40800c",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/locaprancha/",
        scope: "/locaprancha/",
        icons: [
          {
            src: "logo-pitangueiras.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "logo-pitangueiras.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "logo-pitangueiras.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
              },
            },
          },
        ],
      },
    }),
  ],
  base: "/locaprancha/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));
