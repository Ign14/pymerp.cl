import type { JestAxeMatchers } from 'jest-axe';

declare module 'vitest' {
  // Extend Vitest's matchers with jest-axe typings
  interface Assertion<T = any> extends JestAxeMatchers<T> {}
  interface AsymmetricMatchersContaining extends JestAxeMatchers {}
}
