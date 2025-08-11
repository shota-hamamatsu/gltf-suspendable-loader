import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') return `${format}/index.js`;
        return `${format}/index.${format}`;
      },
    },
    minify: 'terser',
    sourcemap: true,
    // rollupOptions: {},
  },
  plugins: [react()],
});
