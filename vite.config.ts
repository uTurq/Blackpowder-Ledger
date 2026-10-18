import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { serviceWorker } from "./pwa/vite-plugin";

export default defineConfig({
  // Relative asset URLs let the same build run from a domain root or a
  // subfolder such as GitHub Pages' /<repo>/.
  base: "./",
  plugins: [react(), serviceWorker()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
  },
});
