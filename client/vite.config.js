import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "ModNet",
        short_name: "ModNet",
        description: "Inter Module Communication",
        theme_color: "#000000",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ["@supabase/supabase-js"], // ✅ force Vite to prebundle Supabase
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true, // ✅ ensure mixed modules work properly
    },
  },
});
