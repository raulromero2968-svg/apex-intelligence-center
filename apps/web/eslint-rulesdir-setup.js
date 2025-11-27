// Setup script for eslint-plugin-rulesdir
const rulesdir = require('eslint-plugin-rulesdir');
const path = require('path');

// Set the RULES_DIR to the custom rules directory
rulesdir.RULES_DIR = path.join(__dirname, '../../.eslint/custom-rules');

module.exports = rulesdir;
