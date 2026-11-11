// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// "component" mode uses the component built in the parent folder instead of the package from npm:
//   npm run dev:local / npm run build:local
const localComponent = fileURLToPath(new URL('../dist/editable-table.js', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    Vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify(),
    Components(),
    ViteFonts({
      google: {
        families: [{
          name: 'Roboto',
          styles: 'wght@100;300;400;500;700;900',
        }],
      },
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      ...(mode === 'component' ? { '@mamenko/editable-table': localComponent } : {}),
    },
    // The local component must use the same instances of Vue and Vuetify as the example
    dedupe: ['vue', 'vuetify'],
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
  base: process.env.BASE_URL || '/',
  build: {
    outDir: process.env.OUT_DIR || 'dist',
  }
}))
