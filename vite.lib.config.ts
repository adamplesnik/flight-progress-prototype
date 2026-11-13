import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** The npm package: dist-lib/index.js (+ the world map chunk), style.css and fonts.css */
export default defineConfig({
  plugins: [react()],
  // fonts.css, copied as it is: the app's bundler resolves its @fontsource imports
  publicDir: 'src/lib/public',
  build: {
    // The world map's chunk, loaded after the first paint
    chunkSizeWarningLimit: 1500,
    outDir: 'dist-lib',
    lib: {
      entry: 'src/lib/build.ts',
      fileName: 'index',
      cssFileName: 'style',
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
    },
  },
})
