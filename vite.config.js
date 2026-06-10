import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    open: true,
  },
  preview: {
    host: 'localhost',
    port: 4173,
    strictPort: false,
  },
})
