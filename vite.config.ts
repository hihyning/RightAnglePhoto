import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections (needed for ngrok)
    port: 5173,
    allowedHosts: [
      'eruptible-murkily-dann.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
    ],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
