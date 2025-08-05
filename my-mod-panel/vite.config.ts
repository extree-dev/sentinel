import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, './'), // Корень - папка client
  publicDir: path.resolve(__dirname, './public'),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    open: true // Автоматически открывать браузер
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});