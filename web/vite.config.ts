import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    // En desarrollo del frontend (npm run dev:web) la API corre con wrangler en el puerto 8787
    proxy: { "/api": "http://localhost:8787" },
  },
});
