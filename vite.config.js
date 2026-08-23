import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El repo se publica en GitHub Pages bajo /Gastos/, así que los assets
// necesitan ese prefijo solo en producción (en local sigue siendo /).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Gastos/' : '/',
  plugins: [react(), tailwindcss()],
}))
