import 'vitest'

// vitest-axe ships its matcher types for an older vitest; declare the one matcher we use.
declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void
  }
}
