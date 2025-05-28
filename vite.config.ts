import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/assets/styles/settings.scss'
      }
    }),
    Components({
      dts: 'src/components.d.ts',
      dirs: ['src/components'],
      extensions: ['vue'],
      deep: true
    }),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia'
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables/**', 'src/stores/**'],
      vueTemplate: true
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8091,
    host: true,
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'vuetify',
      'axios',
      'socket.io-client'
    ]
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'vuetify': ['vuetify'],
          'utils': ['lodash', 'date-fns', 'axios']
        }
      }
    }
  }
})