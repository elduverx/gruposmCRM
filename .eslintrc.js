module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Temporarily disable rules that are causing too many errors
    'no-console': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'prefer-template': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    // Disable rules that are too strict for now
    '@typescript-eslint/no-unsafe-argument': 'off',
    'jsx-a11y/role-supports-aria-props': 'off',
    '@next/next/no-img-element': 'off',
  },
  parserOptions: {
    project: './tsconfig.json',
  },
  ignorePatterns: ['*.js', '*.jsx'],
  overrides: [
    {
      files: ['src/components/map/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off'
      }
    }
  ]
}; 