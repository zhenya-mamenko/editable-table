import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import Vuetify from "vite-plugin-vuetify";
import { resolve } from "node:path";

// Configuration of the test application for the end-to-end tests
export default defineConfig({
  root: resolve(import.meta.dirname, "app"),
  plugins: [
    Vue(),
    Vuetify(),
  ],
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
  logLevel: "warn",
});
