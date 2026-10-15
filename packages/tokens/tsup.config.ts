import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: false, // dist/styles.css is built first and must survive
  sourcemap: false,
  target: 'es2022',
})
