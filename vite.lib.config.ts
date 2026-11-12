import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** The npm package: dist-lib/index.js (+ the world map chunk), dist-lib/style.css */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: false,
  build: {
    // The world map's chunk, loaded after the first paint
    chunkSizeWarningLimit: 1500,
    outDir: 'dist-lib',
    lib: {
      entry: 'src/lib/index.ts',
      fileName: 'index',
      cssFileName: 'style',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        '@tabler/icons-react',
        'clsx',
      ],
    },
  },
})
