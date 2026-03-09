import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow access from network devices
    port: 7001,
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
      host: '192.168.1.2', // Your local IP for HMR
    },
  },
})
