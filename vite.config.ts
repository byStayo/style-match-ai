import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 8080,
    strictPort: true, // Fail if port is in use
    hmr: mode === 'development' ? {
      clientPort: process.env.HTTPS === "true" ? 443 : undefined,
      host: process.env.VITE_HMR_HOST || 'localhost',
      protocol: process.env.HTTPS === "true" ? "wss" : "ws"
    } : false,
    cors: true, // Enable CORS for development
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
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