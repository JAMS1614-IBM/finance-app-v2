/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Browser calls /api; the Express proxy (npm run dev:server) talks to Yahoo Finance.
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: {
    // Recharts dominates the bundle; revisit with code-splitting if it grows.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**', 'server/**'],
      exclude: ['**/*.test.*', 'src/test/**', 'src/main.tsx', 'src/**/*.css', 'src/domain/types.ts', 'server/index.ts', 'server/providers/yahooClient.ts'],
      reporter: ['text-summary', 'text'],
      thresholds: {
        // The transformation logic is the part most worth protecting.
        'src/domain/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'server/**': { statements: 85, lines: 85 },
      },
    },
  },
});
