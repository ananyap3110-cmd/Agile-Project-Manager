import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Simple Vite config. The dev server proxies /api requests to the Express
// backend so the frontend can just call fetch("/api/...") without worrying
// about CORS or hardcoding a host during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
