import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Las peticiones API van directo a :8000 desde el cliente (ver api.js) para no cortar conexión larga.
    // Las rutas /images/… siguen pasando por Vite a FastAPI (miniaturas en <img src="/images/...">).
    proxy: {
      '/images': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // Opcional: si alguien usa aún baseURL /api, mantener reescritura
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
