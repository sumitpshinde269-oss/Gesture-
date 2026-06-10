import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
  server: {
    // Bind only to localhost — no external network access
    host: 'localhost',
    port: 5173,
    strictPort: false,
    open: true, // Auto-open browser on dev start
  },
})
