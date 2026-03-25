import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Allow JSX in plain .js files (original sales App.js uses JSX without .jsx ext)
      include: /\.(jsx?|tsx?)$/
    })
  ],
  root: '.',
  build: {
    rollupOptions: {
      input: './index-sales.html'
    },
    outDir: 'dist-sales'
  },
  server: {
    port: 3002
    // The original Sales CRM (App.js) is self-contained with in-memory data;
    // if it later needs API calls, proxy to the backend: http://localhost:3001
  }
})
