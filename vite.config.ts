
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix process.cwd() type error in node environment of vite.config.ts
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill para que process.env.GEMINI_API_KEY funcione en el navegador
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Evitar crash si se accede a process.env directamente
      'process.env': {}
    },
    build: {
      outDir: 'build', // Vercel espera 'build' por defecto en muchas configuraciones
      chunkSizeWarningLimit: 1600, // Aumentar límite para silenciar advertencia de tamaño
    }
  }
})
