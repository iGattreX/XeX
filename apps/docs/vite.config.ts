import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// Inside the repo the docs site imports the packages' SOURCE for instant HMR. An app in another
// repo would simply install the published packages (see the root README).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@xex/ui/font-picker', replacement: src('../../packages/ui/src/font-picker/index.ts') },
      { find: '@xex/ui', replacement: src('../../packages/ui/src/index.ts') },
      { find: '@xex/tokens/styles.css', replacement: src('../../packages/tokens/dist/styles.css') },
      { find: '@xex/tokens', replacement: src('../../packages/tokens/src/index.ts') },
    ],
  },
})
