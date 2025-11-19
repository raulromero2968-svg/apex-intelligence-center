/**
 * Vercel Programmatic Rollback
 *
 * One-command rollback to previous deployment
 *
 * Usage:
 *   pnpm rollback           # Rollback to previous deployment
 *   pnpm rollback <uid>     # Rollback to specific deployment
 *   pnpm rollback --list    # List recent deployments
 *
 * Requirements:
 * - VERCEL_TOKEN environment variable
 * - VERCEL_PROJECT_ID environment variable (or detected from .vercel/project.json)
 *
 * Setup:
 * 1. Get token: https://vercel.com/account/tokens
 * 2. Set VERCEL_TOKEN in .env.local
 * 3. Run: pnpm rollback
 */

import * as fs from 'fs';
import * as path from 'path';

interface Deployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: string;
  target: string;
  aliasAssigned?: boolean;
}

// Load environment variables from .env.local if present
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.+)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}

loadEnv();

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

// Get project ID from .vercel/project.json or environment
function getProjectId(): string | null {
  if (process.env.VERCEL_PROJECT_ID) {
    return process.env.VERCEL_PROJECT_ID;
  }

  const projectJsonPath = path.join(process.cwd(), '.vercel', 'project.json');
  if (fs.existsSync(projectJsonPath)) {
    try {
      const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
      return projectJson.projectId || null;
    } catch (error) {
      console.error('Failed to parse .vercel/project.json');
    }
  }

  return null;
}

async function fetchDeployments(projectId: string): Promise<Deployment[]> {
  const url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
  };

  if (VERCEL_TEAM_ID) {
    headers['X-Vercel-Team-Id'] = VERCEL_TEAM_ID;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch deployments: ${response.statusText}`);
  }

  const data = await response.json();
  return data.deployments;
}

async function promoteDeployment(deploymentId: string): Promise<void> {
  const url = `https://api.vercel.com/v9/deployments/${deploymentId}/promote`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  };

  if (VERCEL_TEAM_ID) {
    headers['X-Vercel-Team-Id'] = VERCEL_TEAM_ID;
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to promote deployment: ${response.statusText}`);
  }
}

async function listDeployments(projectId: string) {
  console.log('📋 Fetching recent deployments...\n');

  const deployments = await fetchDeployments(projectId);

  console.log('Recent deployments:\n');
  deployments.forEach((deployment, index) => {
    const date = new Date(deployment.created).toLocaleString();
    const current = deployment.aliasAssigned ? '✓ CURRENT' : '';
    console.log(
      `${index + 1}. ${deployment.uid.slice(0, 12)} - ${deployment.state} - ${date} ${current}`
    );
    console.log(`   URL: https://${deployment.url}`);
    console.log('');
  });
}

async function rollback(projectId: string, targetUid?: string) {
  const deployments = await fetchDeployments(projectId);

  if (deployments.length < 2) {
    console.error('❌ Not enough deployments to rollback');
    process.exit(1);
  }

  let targetDeployment: Deployment;

  if (targetUid) {
    // Rollback to specific deployment
    const found = deployments.find((d) => d.uid.startsWith(targetUid));
    if (!found) {
      console.error(`❌ Deployment ${targetUid} not found`);
      process.exit(1);
    }
    targetDeployment = found;
  } else {
    // Rollback to previous deployment
    const currentIndex = deployments.findIndex((d) => d.aliasAssigned);
    if (currentIndex === -1) {
      console.error('❌ Could not determine current deployment');
      process.exit(1);
    }

    if (currentIndex >= deployments.length - 1) {
      console.error('❌ No previous deployment to rollback to');
      process.exit(1);
    }

    targetDeployment = deployments[currentIndex + 1];
  }

  console.log('🔄 Rolling back to deployment:');
  console.log(`   UID: ${targetDeployment.uid}`);
  console.log(`   URL: https://${targetDeployment.url}`);
  console.log(`   Created: ${new Date(targetDeployment.created).toLocaleString()}\n`);

  await promoteDeployment(targetDeployment.uid);

  console.log('✅ Rollback complete!');
  console.log(`🌐 Production URL: https://${targetDeployment.url}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN environment variable not set');
    console.error('   Get your token at: https://vercel.com/account/tokens');
    process.exit(1);
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.error('❌ Could not determine project ID');
    console.error('   Set VERCEL_PROJECT_ID environment variable or run `vercel link`');
    process.exit(1);
  }

  try {
    if (args.includes('--list') || args.includes('-l')) {
      await listDeployments(projectId);
    } else {
      const targetUid = args[0];
      await rollback(projectId, targetUid);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
