/**
 * lint-staged configuration
 * 
 * Runs linters and formatters on staged files before commit
 */

export default {
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{md,json,yml,yaml}': [
    'prettier --write',
  ],
};

