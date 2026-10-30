import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages sirve el proyecto en https://<usuario>.github.io/GestionCaballos/
// Se puede sobrescribir con BASE_PATH (p. ej. "/" para un dominio propio).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/GestionCaballos/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
