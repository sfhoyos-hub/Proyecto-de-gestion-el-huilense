import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Rutas del backend (Express en el puerto 3000). En desarrollo (npm run dev)
// Vite las reenvía al backend; en producción Express sirve esta app en /app/.
const RUTAS_API = ['/login', '/meseros', '/domingos', '/ventas', '/ranking', '/racha', '/bonificaciones'];

export default defineConfig({
  base: '/app/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: Object.fromEntries(RUTAS_API.map((ruta) => [ruta, 'http://localhost:3000']))
  }
});
