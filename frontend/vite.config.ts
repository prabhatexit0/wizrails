import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.wasm'],
  server: {
    fs: {
      // Allow serving files from the wasm-engine/pkg directory
      allow: ['.', path.resolve(__dirname, '../wasm-engine/pkg')],
    },
  },
})
