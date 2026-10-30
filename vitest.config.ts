import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves path aliases declared in tsconfig.json (Vite 6+ / Vitest 3+).
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/database/data-source.ts',
        'src/migrations/**',
        '**/*.module.ts',
        '**/*.spec.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
});
