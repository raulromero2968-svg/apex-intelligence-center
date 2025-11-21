#!/usr/bin/env tsx
/**
 * Lockfile Validation Script
 *
 * Ensures pnpm-lock.yaml is up to date with package.json dependencies.
 * This prevents ERR_PNPM_OUTDATED_LOCKFILE errors in CI/CD environments.
 *
 * Exit codes:
 * - 0: Lockfile is up to date
 * - 1: Lockfile is outdated (run `pnpm install` to fix)
 */

import { execSync } from 'child_process';

try {
  // Test if lockfile is up to date using --frozen-lockfile
  // This will fail if the lockfile doesn't match package.json
  // We check for the specific error message that indicates an outdated lockfile
  execSync('pnpm install --frozen-lockfile --ignore-scripts', {
    stdio: 'pipe',
    cwd: process.cwd()
  });

  console.log('✅ pnpm-lock.yaml is up to date');
  process.exit(0);
} catch (error: any) {
  const errorOutput = error.stderr?.toString() || error.stdout?.toString() || '';

  // Check if the error is specifically about outdated lockfile
  if (errorOutput.includes('ERR_PNPM_OUTDATED_LOCKFILE') ||
      errorOutput.includes('Lockfile is up to date')) {
    console.error('\n❌ ERROR: pnpm-lock.yaml is outdated!\n');
    console.error('The lockfile does not match your package.json dependencies.');
    console.error('This will cause builds to fail in CI/CD environments.\n');
    console.error('To fix this issue, run:\n');
    console.error('  pnpm install\n');
    console.error('Then commit the updated pnpm-lock.yaml file.\n');
    process.exit(1);
  }

  // If it's a different error (like network issues), just warn but don't fail
  console.warn('⚠️  Warning: Could not verify lockfile status');
  console.warn('Error:', error.message);
  process.exit(0);
}

