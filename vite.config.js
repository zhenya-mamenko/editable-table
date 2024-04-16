import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify from 'vite-plugin-vuetify'
import { resolve } from "node:path";
import pkg from "./package.json";
import strip from '@rollup/plugin-strip';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import replace from './build_utils/replace.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Vue({isProduction: true,}),
    Vuetify(),
    strip(),
    cssInjectedByJsPlugin(),
  ],
  build: {
    sourcemap: true,
    minify: false,
    lib: {
      formats: ["es"],
      entry: resolve(__dirname, "src/index.js"),
      name: "EditableTable",
      fileName: "editable-table",
    },
    rollupOptions: {
      external: [
        ...Object.keys(pkg.peerDependencies),
        /node_modules/,
      ],
      makeAbsoluteExternalsRelative: true,
      output: {
        plugins: [
          replace({
            from: /"\.\.\/node_modules\/vuetify\/lib\/components\/([^\/]+)[^"]+"/g,
            to: '"vuetify/components/$1"',
          }),
        ],
      },
    },
  },
});