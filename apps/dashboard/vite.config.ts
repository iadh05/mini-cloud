import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Same origin as the API (ADR-0011): in development Vite forwards /v1 to the API.
const LOCAL_API = "http://localhost:3000";
const apiUrl = process.env.API_URL ?? LOCAL_API;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/v1": apiUrl },
  },
});
