import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // Sert depuis https://pyrou.github.io/tinytraffictown/ une fois publié.
  base: command === "build" ? "/tinytraffictown/" : "/",
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
  },
}));
