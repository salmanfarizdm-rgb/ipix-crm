import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    allowedHosts: ['all', '.ngrok-free.dev', '.ngrok-free.app', '.serveousercontent.com', '.loca.lt'],
    proxy: { '/api': { target: 'http://localhost:3004', changeOrigin: true } }
  }
})
