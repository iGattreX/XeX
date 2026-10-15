import xex from '@xex/tailwind-preset'

export default {
  presets: [xex],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // In this repo the components' source; an app installing @xex/ui scans './node_modules/@xex/ui/dist/**/*.js'.
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
}
