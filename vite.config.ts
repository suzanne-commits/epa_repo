import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { cpSync } from 'fs'

// dataLoader.ts fetches from '/data/reference/*.json' at the site root. Vite's
// dev server serves the whole project root, so this works unmodified in dev —
// but `vite build` only copies `publicDir` into `dist/`, so without this the
// production build silently ships with no data. Mirror /data into dist/data
// once the rest of the bundle is written.
function copyDataDir(): Plugin {
  return {
    name: 'copy-data-dir',
    apply: 'build',
    closeBundle() {
      cpSync(resolve(__dirname, 'data'), resolve(__dirname, 'dist/data'), {
        recursive: true,
        filter: src => !src.endsWith('.DS_Store'),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), copyDataDir()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
