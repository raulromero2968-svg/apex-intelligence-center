import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Default to node environment (for lib/server tests)
    environment: 'node',
    // Use jsdom for component tests (*.tsx files in __tests__ directories)
    environmentMatchGlobs: [
      // React component tests need jsdom
      ['**/components/**/__tests__/*.test.tsx', 'jsdom'],
      ['**/components/**/*.test.tsx', 'jsdom'],
      // Hooks that use React also need jsdom
      ['**/hooks/**/__tests__/*.test.ts', 'jsdom'],
      ['**/stores/**/__tests__/*.test.ts', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Exclude playwright e2e tests from vitest
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/**',
    ],
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    // Setup files for React component testing
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

