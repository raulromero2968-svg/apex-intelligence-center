import { execSync } from 'node:child_process';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function main() {
  const SENTRY_ORG = getEnv('SENTRY_ORG');
  const SENTRY_PROJECT = getEnv('SENTRY_PROJECT');
  const SENTRY_AUTH_TOKEN = getEnv('SENTRY_AUTH_TOKEN');
  const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT ?? 'production';
  const DEPLOY_URL = process.env.DEPLOY_URL ?? 'https://apexintelligence.io';

  const revision = execSync('git rev-parse HEAD').toString().trim();
  const version = revision;

  // Create Sentry release
  console.log(`Creating Sentry release ${version} for project ${SENTRY_PROJECT}...`);
  execSync(
    `npx sentry-cli releases new ${version} ` +
      `--org ${SENTRY_ORG} --project ${SENTRY_PROJECT}`,
    { stdio: 'inherit', env: { ...process.env, SENTRY_AUTH_TOKEN } },
  );

  // Associate commits (best effort)
  console.log('Associating commits with Sentry release...');
  execSync(
    `npx sentry-cli releases set-commits ${version} --auto ` +
      `--org ${SENTRY_ORG} --project ${SENTRY_PROJECT}`,
    { stdio: 'inherit', env: { ...process.env, SENTRY_AUTH_TOKEN } },
  );

  // Finalize release
  console.log('Finalizing Sentry release...');
  execSync(
    `npx sentry-cli releases finalize ${version} ` +
      `--org ${SENTRY_ORG} --project ${SENTRY_PROJECT}`,
    { stdio: 'inherit', env: { ...process.env, SENTRY_AUTH_TOKEN } },
  );

  // Create deploy
  console.log(`Creating Sentry deploy for ${SENTRY_ENVIRONMENT} at ${DEPLOY_URL}...`);
  execSync(
    `npx sentry-cli releases deploys ${version} new ` +
      `-e ${SENTRY_ENVIRONMENT} -u ${DEPLOY_URL} ` +
      `--org ${SENTRY_ORG} --project ${SENTRY_PROJECT}`,
    { stdio: 'inherit', env: { ...process.env, SENTRY_AUTH_TOKEN } },
  );

  console.log('✅ Sentry release and deploy created successfully.');
}

main();

