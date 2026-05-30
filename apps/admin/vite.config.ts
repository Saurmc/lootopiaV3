import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const reactPath = path.resolve(__dirname, 'node_modules/react');
const reactDomPath = path.resolve(__dirname, 'node_modules/react-dom');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      react: reactPath,
      'react-dom': reactDomPath,
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
});
