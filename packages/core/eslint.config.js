/**
 * @apex/core ESLint Configuration
 *
 * Enforces code quality and ethics-aware patterns across the package.
 */

module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // TypeScript strict rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],

    // Ethics-aware patterns (custom conventions)
    // Flag potentially unsafe automation patterns
    'no-restricted-syntax': [
      'warn',
      {
        selector: "CallExpression[callee.name='automateWithoutGuard']",
        message: 'Use ethicsGuard() before automation actions',
      },
      {
        selector: "Literal[value='full'][parent.key.name='automationLevel']",
        message: 'Full automation requires ethics review - consider ethicsGuard()',
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: { jest: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
