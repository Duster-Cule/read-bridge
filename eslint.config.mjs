import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

export default [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ['src-tauri/target/**'],
  },
  {
    rules: {
      // Next 16 enables some stricter React Compiler/hook rules by default.
      // Keep lint non-blocking (warnings only) to match prior `next lint` behavior.
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',

      // Keep existing codebase compatible; tighten later if desired.
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'warn',
    },
  },
]
