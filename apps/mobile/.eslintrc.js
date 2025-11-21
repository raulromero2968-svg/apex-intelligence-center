module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  env: {
    es6: true,
    node: true,
  },
  ignorePatterns: [
    'babel.config.js',
    'metro.config.js',
    'tailwind.config.js',
    'jest.config.js',
    'jest.setup.js',
    'index.js',
    'e2e/',
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
  ],
};

