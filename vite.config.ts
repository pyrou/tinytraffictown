import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
  },
});
