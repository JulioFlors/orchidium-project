import { baseConfig } from '@package/eslint-config/base'

export default [
  ...baseConfig,
  {
    // Ignore workspaces already handled by Turbo to avoid redundant linting
    ignores: [
      '**/node_modules/**',
      '.turbo/**',
      'dist/**',
      '.next/**',
      'app/**',
      'services/**',
      'packages/**',
      'firmware/**'
    ],
  }
]
