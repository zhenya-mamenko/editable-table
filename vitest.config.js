import { defineConfig } from "vitest/config";
import Vue from "@vitejs/plugin-vue";
import Vuetify from "vite-plugin-vuetify";

export default defineConfig({
  plugins: [
    Vue(),
    Vuetify(),
  ],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.spec.js"],
    setupFiles: ["tests/unit/setup.js"],
    server: {
      deps: {
        inline: ["vuetify"],
      },
    },
  },
});
