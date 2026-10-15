import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'font-picker': 'src/font-picker/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  target: 'es2022',
  // dependencies / peerDependencies (react, @heroicons/react, clsx, @xex/tokens) stay external automatically
  splitting: true,
})
