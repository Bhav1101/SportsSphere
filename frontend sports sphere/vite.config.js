import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Emergent preview the ingress routes /api/* to the backend (port 8001)
// and everything else to this Vite server (port 3000). To make uploaded
// static files served by the Express backend (e.g. /profiles/x.jpg,
// /documents/x.pdf, /sports/x.png ...) reachable from the frontend, we
// proxy those paths to the backend during dev.
const STATIC_PROXY_PATHS = [
  '/profiles',
  '/documents',
  '/sports',
  '/teams',
  '/players',
  '/api',
]

const proxy = STATIC_PROXY_PATHS.reduce((acc, p) => {
  acc[p] = {
    target: 'http://127.0.0.1:8001',
    changeOrigin: true,
    secure: false,
  }
  return acc
}, {})

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    allowedHosts: true,
    proxy,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
})
