import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Listen on all local IPs
    port: 8080,
    strictPort: true, // Fail if port is in use
    hmr: mode === 'development' ? {
      clientPort: process.env.HTTPS === "true" ? 443 : undefined,
      host: process.env.VITE_HMR_HOST || 'localhost'
    } : false,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));