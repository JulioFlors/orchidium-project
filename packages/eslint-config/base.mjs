import globals from 'globals'
import tseslint from 'typescript-eslint'
import { fixupPluginRules } from '@eslint/compat'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import eslintPluginImport from 'eslint-plugin-import'
import vercelStyleGuideTypescript from '@vercel/style-guide/eslint/typescript'
import markdown from '@eslint/markdown'

export const prettierOptions = {
  printWidth: 100,
  trailingComma: 'all',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'auto',
  emptyFunctions: 'preserve',
}

export const baseConfig = [
  // Ignores
  {
    ignores: ['eslint.config.mjs', 'node_modules', '.next', 'out', 'dist', 'coverage', '.idea'],
  },
  // General configuration
  {
    rules: {
      'padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: '*', next: ['return', 'export'] },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
      ],
      'no-console': 'warn',
    },
  },
  // TypeScript configuration
  ...[
    ...tseslint.configs.recommended,
    {
      files: ['**/*.{ts,tsx,mts,cts}'],
      rules: {
        ...vercelStyleGuideTypescript.rules,
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-shadow': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            args: 'after-used',
            ignoreRestSiblings: false,
            argsIgnorePattern: '^_.*?$',
          },
        ],
      },
    },
  ],
  // Prettier configuration
  ...[
    eslintPluginPrettier,
    {
      rules: {
        'prettier/prettier': ['warn', prettierOptions],
      },
    },
  ],
  // Import configuration
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}'],
    plugins: {
      import: fixupPluginRules(eslintPluginImport),
    },
    rules: {
      'import/no-default-export': 'off',
      'import/order': [
        'warn',
        {
          groups: [
            'type',
            'builtin',
            'object',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            {
              pattern: '~/**',
              group: 'external',
              position: 'after',
            },
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
  // Markdown configuration
  {
    files: ['**/*.md'],
    plugins: {
      markdown,
    },
    language: 'markdown/commonmark',
    rules: {
      ...markdown.configs.recommended.rules,
      'markdown/no-html': 'off', // Allow HTML
    },
  },
]
