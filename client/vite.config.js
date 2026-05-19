import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    hmr: {
      hmr: false,
    },
    proxy: {
      '/api': {
        target: 'https://livedigit-ems-server.vercel.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})