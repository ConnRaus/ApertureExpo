import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      // Configure Tailwind to properly handle CSS modules
      cssModules: true,
    }),
  ],
  envPrefix: "VITE_",
  server: {
    host: true,
    port: 80,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },
  build: {
    target: "es2020",
    // Configure how CSS modules are processed
    cssCodeSplit: true,
    cssMinify: true,
  },
});
