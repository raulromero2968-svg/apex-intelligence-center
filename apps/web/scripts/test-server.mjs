#!/usr/bin/env node

/**
 * Test server harness for Vitest smoke tests
 * 
 * 1. Starts Next.js dev server on a random port
 * 2. Waits for /api/health endpoint to be ready
 * 3. Runs vitest smoke tests
 * 4. Kills the dev server
 */

import { spawn } from 'child_process';
import { randomInt } from 'crypto';
import { setTimeout } from 'timers/promises';

const PORT = randomInt(3001, 65535);
const BASE_URL = `http://localhost:${PORT}`;
const HEALTH_URL = `${BASE_URL}/api/health`;
const MAX_WAIT_MS = 60000; // 60 seconds max wait
const POLL_INTERVAL_MS = 500; // Check every 500ms

let devServer = null;
let exitCode = 0;

async function waitForHealth() {
  const startTime = Date.now();
  
  while (Date.now() - startTime < MAX_WAIT_MS) {
    try {
      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      
      if (response.ok) {
        console.log(`✓ Server ready at ${BASE_URL}`);
        return true;
      }
    } catch (error) {
      // Server not ready yet, continue polling
    }
    
    await setTimeout(POLL_INTERVAL_MS);
  }
  
  throw new Error(`Server did not become ready within ${MAX_WAIT_MS}ms`);
}

function killServer() {
  if (devServer && !devServer.killed) {
    console.log('Stopping dev server...');
    try {
      // Try graceful shutdown first
      devServer.kill('SIGTERM');
      // On Windows, if SIGTERM doesn't work, try SIGKILL after a delay
      if (process.platform === 'win32') {
        setTimeout(() => {
          if (devServer && !devServer.killed) {
            devServer.kill('SIGKILL');
          }
        }, 2000);
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
    devServer = null;
  }
}

// Cleanup on exit
process.on('SIGINT', () => {
  killServer();
  process.exit(1);
});

process.on('SIGTERM', () => {
  killServer();
  process.exit(1);
});

async function main() {
  try {
    // Start Next.js dev server
    console.log(`Starting Next.js dev server on port ${PORT}...`);
    devServer = spawn('pnpm', ['dev', '--', '-p', PORT.toString()], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PORT: PORT.toString(),
      },
    });

    // Handle dev server errors
    devServer.on('error', (error) => {
      console.error('Failed to start dev server:', error.message);
      exitCode = 1;
    });

    devServer.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Dev server exited with code ${code}`);
        exitCode = 1;
      }
    });

    // Wait for server to be ready
    await waitForHealth();

    // Run vitest smoke tests
    console.log('Running smoke tests...');
    const vitest = spawn('pnpm', ['vitest', 'run', 'tests/smoke/research-api.spec.ts'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        BASE_URL,
      },
    });

    // Wait for vitest to complete
    await new Promise((resolve) => {
      vitest.on('exit', (code) => {
        exitCode = code || 0;
        resolve();
      });
    });

  } catch (error) {
    console.error('Error:', error.message);
    exitCode = 1;
  } finally {
    killServer();
    
    // Give server a moment to shut down
    await setTimeout(1000);
    
    process.exit(exitCode);
  }
}

main();

