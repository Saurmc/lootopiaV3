import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const reactPath = path.resolve(__dirname, 'node_modules/react');
const reactDomPath = path.resolve(__dirname, 'node_modules/react-dom');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: reactPath,
      'react-dom': reactDomPath,
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    server: {
      deps: {
        // Packages installés à la racine du monorepo, pas dans apps/backoffice/node_modules.
        // Ils doivent être inlinés pour que l'alias React s'applique (éviter double instance).
        inline: [
          'zustand',
          'react-hook-form',
          '@tanstack/react-query',
          'lucide-react',
          '@radix-ui/react-dialog',
          '@radix-ui/react-label',
          '@radix-ui/react-select',
          '@radix-ui/react-slot',
          '@radix-ui/react-separator',
          '@radix-ui/react-popper',
          '@radix-ui/react-portal',
          '@radix-ui/react-primitive',
          '@radix-ui/react-focus-guard',
          '@radix-ui/react-focus-scope',
          '@radix-ui/react-id',
          '@radix-ui/react-use-callback-ref',
          '@radix-ui/react-use-controllable-state',
          '@radix-ui/react-use-escape-keydown',
          '@radix-ui/react-use-layout-effect',
          '@radix-ui/react-visually-hidden',
          '@radix-ui/react-collection',
          '@radix-ui/react-compose-refs',
          '@radix-ui/react-context',
          '@radix-ui/react-dismissable-layer',
          '@radix-ui/react-presence',
          'react-remove-scroll',
          'react-remove-scroll-bar',
          'class-variance-authority',
          'clsx',
          'tailwind-merge',
        ],
      },
    },
  },
});
