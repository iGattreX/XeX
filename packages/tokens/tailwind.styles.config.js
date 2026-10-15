// Only used to compile src/styles.src.css (resolves its @apply rules into plain CSS).
// No content globs: the library CSS must not depend on which utilities an app happens to use.
import preset from '@xex/tailwind-preset'

export default {
  presets: [preset],
  content: ['./nothing-to-scan'],
}
