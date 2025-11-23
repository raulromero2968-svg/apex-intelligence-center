const rulesdir = require('eslint-plugin-rulesdir');
const path = require('path');

// Configure rulesdir plugin
rulesdir.RULES_DIR = path.join(__dirname, '../../.eslint/custom-rules');

module.exports = {
  extends: ['../../.eslintrc.json'],
  ignorePatterns: ['../mobile/**', 'node_modules/**', '.next/**', 'dist/**']
};
