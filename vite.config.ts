import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'excalidraw': ['@excalidraw/excalidraw'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'utils': ['idb']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
