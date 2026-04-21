import globals from 'globals'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactCompiler from 'eslint-plugin-react-compiler'
import eslintPluginNext from '@next/eslint-plugin-next'
import eslintPluginJsxA11y from 'eslint-plugin-jsx-a11y'
import vercelStyleGuideReact from '@vercel/style-guide/eslint/rules/react'
import vercelStyleGuideNext from '@vercel/style-guide/eslint/next'
import { fixupPluginRules } from '@eslint/compat'

import { baseConfig, prettierOptions } from './base.mjs'

export const nextConfig = [
  ...baseConfig,
  // React configuration
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}'],
    plugins: {
      react: fixupPluginRules(eslintPluginReact),
      'react-hooks': fixupPluginRules(eslintPluginReactHooks),
      'react-compiler': fixupPluginRules(eslintPluginReactCompiler),
      'jsx-a11y': fixupPluginRules(eslintPluginJsxA11y),
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'prettier/prettier': [
        'warn',
        {
          ...prettierOptions,
          plugins: ['prettier-plugin-tailwindcss'],
        },
      ],
      ...eslintPluginReact.configs.recommended.rules,
      ...eslintPluginJsxA11y.configs.recommended.rules,
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...vercelStyleGuideReact.rules,
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/self-closing-comp': 'warn',
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          shorthandFirst: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
      'react-compiler/react-compiler': 'error',
      'react/jsx-no-leaked-render': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
    },
  },
  // Next configuration
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}'],
    plugins: {
      next: fixupPluginRules(eslintPluginNext),
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      ...vercelStyleGuideNext.rules,
      '@next/next/no-img-element': 'off',
    },
  },
]
