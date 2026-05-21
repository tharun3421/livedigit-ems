import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        }
      }
    }
  },
  server: {
    hmr: false,
    proxy: {
      '/api': {
        target: 'https://livedigit-ems-server.vercel.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})