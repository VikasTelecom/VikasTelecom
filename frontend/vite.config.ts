import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  // lovable-tagger can run ESLint-like checks and fail dev startup when the repo
  // has existing lint errors. Keep it opt-in so `npm run dev` always starts.
  plugins: [
    react(),
    mode === "development" && process.env.VITE_ENABLE_TAGGER === "true" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
