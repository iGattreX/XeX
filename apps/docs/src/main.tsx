import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@xex/ui'
// Self-hosted fonts: the design system never asks Google for Inter or JetBrains Mono.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import App from './App'
import './index.css'
// Design-system rules (brand overrides, dark mode, .card, loaders …). Import AFTER the app's own CSS.
import '@xex/tokens/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider storagePrefix="xex-docs">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
