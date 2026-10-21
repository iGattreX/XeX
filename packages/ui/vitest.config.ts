import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
  },
  esbuild: { jsx: 'automatic' },
  // Tests that import docs-app code (which imports '@xex/ui') should exercise this source, not a stale build.
  resolve: { alias: [{ find: /^@xex\/ui$/, replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) }] },
})
