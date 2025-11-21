import { execSync } from 'node:child_process';

type CheckStatus = 'ok' | 'warn' | 'fail';

interface CheckResult {
  name: string;
  status: CheckStatus;
  message: string;
  meta?: Record<string, unknown>;
}

interface ApiEndpoint {
  name: string;
  url: string;
  method?: 'GET' | 'POST';
  body?: unknown;
}

const PROD_URL = getEnv('PROD_URL', 'https://apexintelligence.io');
const SLACK_WEBHOOK = process.env.SLACK_IMMORTAL_WEBHOOK_URL ?? '';
const SENTRY_ORG = process.env.SENTRY_ORG ?? '';
const SENTRY_PROJECT = process.env.SENTRY_PROJECT ?? '';
const SENTRY_TOKEN = process.env.SENTRY_AUTH_TOKEN ?? '';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN ?? '';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID ?? '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? '';

async function main() {
  if (!SLACK_WEBHOOK) {
    throw new Error('Missing SLACK_IMMORTAL_WEBHOOK_URL');
  }

  const repo = await resolveRepo();
  const commitSha = await getLatestCommitSha();

  const checks: CheckResult[] = [];

  const guardrail = await guardrailCiCheck(repo);
  checks.push(guardrail);

  const apiHealthChecks = await runApiChecks();
  checks.push(...apiHealthChecks);

  const vercelCheck = await fetchLatestVercelDeployment();
  if (vercelCheck) {
    checks.push(vercelCheck);
  }

  const sentryCheck = await sentryErrorCheck();
  checks.push(sentryCheck);

  const consoleCheck = consoleErrorPlaceholder();
  checks.push(consoleCheck);

  const overallStatus = deriveOverallStatus(checks);
  const summary = buildSummary({
    status: overallStatus,
    commitSha,
    guardrail,
    apiChecks: apiHealthChecks,
    sentry: sentryCheck,
    vercel: vercelCheck ?? null,
    consoleCheck,
  });

  await postToSlack(summary);

  logReport(summary, checks);
}

function getEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

async function resolveRepo(): Promise<{ owner: string; repo: string }> {
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    return { owner, repo };
  }

  const remote = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
  if (remote.startsWith('git@')) {
    const [, path] = remote.split(':');
    const [owner, repoWithSuffix] = path.split('/');
    return { owner, repo: repoWithSuffix.replace(/\.git$/, '') };
  }

  if (remote.startsWith('https://') || remote.startsWith('http://')) {
    const segments = remote.replace(/\.git$/, '').split('/');
    const owner = segments.at(-2);
    const repo = segments.at(-1);
    if (!owner || !repo) {
      throw new Error(`Unable to parse remote ${remote}`);
    }
    return { owner, repo };
  }

  throw new Error('Could not resolve repository information');
}

async function guardrailCiCheck(repo: { owner: string; repo: string }): Promise<CheckResult> {
  const endpoint = `https://api.github.com/repos/${repo.owner}/${repo.repo}/actions/workflows/pr-ci.yml/runs?per_page=1&status=completed`;
  const res = await fetchWithAuth(endpoint, {
    headers: {
      'User-Agent': 'weekly-immortal-health',
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    return {
      name: 'Guardrail CI',
      status: 'warn',
      message: `Failed to query GitHub API: ${res.status} ${res.statusText}`,
    };
  }

  const data: {
    workflow_runs?: Array<{
      id: number;
      html_url: string;
      status: string;
      conclusion: string | null;
      head_sha: string;
      updated_at: string;
    }>;
  } = await res.json();

  const latest = data.workflow_runs?.[0];

  if (!latest) {
    return {
      name: 'Guardrail CI',
      status: 'warn',
      message: 'No workflow runs found for pr-ci.yml',
    };
  }

  const ok = latest.conclusion === 'success';
  return {
    name: 'Guardrail CI',
    status: ok ? 'ok' : 'fail',
    message: ok
      ? `Latest run succeeded at ${latest.updated_at}`
      : `Latest run ${latest.conclusion ?? 'unknown'} (id ${latest.id})`,
    meta: {
      runUrl: latest.html_url,
      headSha: latest.head_sha,
      updatedAt: latest.updated_at,
    },
  };
}

async function runApiChecks(): Promise<CheckResult[]> {
  const base = PROD_URL.replace(/\/$/, '');
  const endpoints: ApiEndpoint[] = [
    {
      name: 'Production web',
      url: base,
    },
    {
      name: 'Health endpoint',
      url: `${base}/api/health`,
    },
    {
      name: 'RAG research API',
      url: `${base}/api/research`,
      method: 'POST',
      body: { query: 'health check ping' },
    },
  ];

  const cronCheck: CheckResult = {
    name: 'Cron watchdog',
    status: 'warn',
    message: 'Cron health endpoint requires secret; manual confirmation pending',
  };

  const results: CheckResult[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method ?? 'GET',
        headers: endpoint.body ? { 'Content-Type': 'application/json' } : undefined,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        results.push({
          name: endpoint.name,
          status: 'fail',
          message: `${response.status} ${response.statusText}`,
        });
        continue;
      }

      let detail = `${response.status}`;
      if (endpoint.name === 'RAG research API') {
        const json = await response.json().catch(() => null);
        detail = json ? '200 OK (payload received)' : '200 OK (no JSON payload)';
      }

      results.push({
        name: endpoint.name,
        status: 'ok',
        message: detail,
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  results.push(cronCheck);
  return results;
}

async function fetchLatestVercelDeployment(): Promise<CheckResult | null> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return null;
  }

  const params = new URLSearchParams({
    projectId: VERCEL_PROJECT_ID,
    limit: '1',
    state: 'READY',
  });

  const res = await fetch(`https://api.vercel.com/v13/deployments?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    },
  });

  if (!res.ok) {
    return {
      name: 'Vercel deployment',
      status: 'warn',
      message: `Failed to fetch deployments: ${res.status}`,
    };
  }

  const data: {
    deployments?: Array<{
      uid: string;
      state: string;
      readyState: string;
      createdAt: number;
      url: string;
    }>;
  } = await res.json();

  const deployment = data.deployments?.[0];
  if (!deployment) {
    return {
      name: 'Vercel deployment',
      status: 'warn',
      message: 'No deployments returned',
    };
  }

  const healthy = deployment.readyState === 'READY';

  return {
    name: 'Vercel deployment',
    status: healthy ? 'ok' : 'fail',
    message: `${deployment.readyState} (${deployment.url})`,
    meta: {
      uid: deployment.uid,
      createdAt: new Date(deployment.createdAt).toISOString(),
    },
  };
}

async function sentryErrorCheck(): Promise<CheckResult> {
  if (!SENTRY_ORG || !SENTRY_PROJECT || !SENTRY_TOKEN) {
    return {
      name: 'Sentry errors (24h)',
      status: 'warn',
      message: 'Missing Sentry configuration',
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const since = now - 24 * 60 * 60;
  const url = `https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/stats/?stat=received&since=${since}&until=${now}&resolution=1h`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SENTRY_TOKEN}`,
    },
  });

  if (!res.ok) {
    return {
      name: 'Sentry errors (24h)',
      status: 'warn',
      message: `Sentry API error: ${res.status}`,
    };
  }

  const buckets: Array<[number, number]> = await res.json();
  const total = buckets.reduce((sum, [, count]) => sum + count, 0);

  const status: CheckStatus = total === 0 ? 'ok' : total <= 5 ? 'warn' : 'fail';

  return {
    name: 'Sentry errors (24h)',
    status,
    message: `${total} events`,
  };
}

function consoleErrorPlaceholder(): CheckResult {
  return {
    name: 'Console error sanity',
    status: 'warn',
    message: 'Synthetic console check not wired – manual confirmation required',
  };
}

function deriveOverallStatus(checks: CheckResult[]): '✅' | '⚠️' | '🔴' {
  if (checks.some((c) => c.status === 'fail')) {
    return '🔴';
  }
  if (checks.some((c) => c.status === 'warn')) {
    return '⚠️';
  }
  return '✅';
}

function buildSummary({
  status,
  commitSha,
  guardrail,
  apiChecks,
  sentry,
  vercel,
  consoleCheck,
}: {
  status: '✅' | '⚠️' | '🔴';
  commitSha: string;
  guardrail: CheckResult;
  apiChecks: CheckResult[];
  sentry: CheckResult;
  vercel: CheckResult | null;
  consoleCheck: CheckResult;
}): string {
  const apiSummary = apiChecks
    .map((check) => `• ${formatCheck(check)}`)
    .join('\n');

  const vercelSummary = vercel ? `\n*Vercel:* ${formatCheck(vercel)}` : '';

  return [
    `*Weekly Immortal Health*`,
    `*Status:* ${status}`,
    `*Latest Commit:* ${commitSha}`,
    `*Guardrail CI:* ${formatCheck(guardrail)}`,
    `*API Health:*\n${apiSummary}`,
    `*Sentry (24h):* ${formatCheck(sentry)}`,
    `*Console Errors:* ${formatCheck(consoleCheck)}`,
    vercelSummary,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatCheck(check: CheckResult): string {
  const prefix = check.status === 'ok' ? '✅' : check.status === 'warn' ? '⚠️' : '🔴';
  return `${prefix} ${check.name} – ${check.message}`;
}

async function postToSlack(text: string): Promise<void> {
  const res = await fetch(SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Failed to post to Slack: ${res.status} ${res.statusText}`);
  }
}

async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (GITHUB_TOKEN) {
    headers.set('Authorization', `Bearer ${GITHUB_TOKEN}`);
  }
  return fetch(url, {
    ...init,
    headers,
  });
}

async function getLatestCommitSha(): Promise<string> {
  return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
}

function logReport(summary: string, checks: CheckResult[]) {
  console.log(summary);
  console.log('\nDetails:');
  for (const check of checks) {
    console.log(`- ${check.name}: ${check.status} (${check.message})`);
  }
}

main().catch((error) => {
  console.error('Weekly Immortal Health report failed:', error);
  process.exitCode = 1;
});

