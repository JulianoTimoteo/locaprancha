import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "logo-pitangueiras.png",
        "apple-touch-icon.png",
        "apple-touch-icon-152.png",
        "apple-touch-icon-120.png",
      ],
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,ico,svg,woff2,json}"],
        navigateFallback: "/locaprancha/index.html",
        navigateFallbackDenylist: [/^\/locaprancha\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
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
    chunkSizeWarningLimit: 1000,
  },
});
