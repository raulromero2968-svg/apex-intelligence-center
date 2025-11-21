import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import readline from 'node:readline';
import { once } from 'node:events';
import { createHash, randomBytes, createCipheriv } from 'node:crypto';
import { ZipFile } from 'yazl';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

type EnvConfig = {
  databaseUrl: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsBucket: string;
  vercelToken: string;
  vercelProjectId: string;
  encryptionKey?: string;
};

type Artifact = {
  path: string;
  name?: string;
};

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(__dirname, '..');
const TMP_ROOT =
  process.env.ETERNAL_BACKUP_TMP_DIR ??
  (process.platform === 'win32' ? path.join(os.tmpdir(), 'apex-eternal') : '/tmp');

const TIMESTAMP = formatTimestamp(new Date());
const REPO_ARCHIVE_PATH = path.join(TMP_ROOT, 'apex-intelligence-center.zip');
const DB_RAW_PATH = path.join(TMP_ROOT, 'apex-db-raw.sql');
const DB_SANITIZED_PATH = path.join(TMP_ROOT, 'apex-db-anonymized.sql');
const VERCEL_SNAPSHOT_PATH = path.join(TMP_ROOT, 'vercel-deployment.json');
const FINAL_ZIP_PATH = path.join(TMP_ROOT, `apex-eternal-backup-${TIMESTAMP}.zip`);

async function main() {
  const env = loadEnv();
  await fs.mkdir(TMP_ROOT, { recursive: true });

  console.log(`[eternal-backup] Working directory: ${REPO_ROOT}`);
  console.log(`[eternal-backup] Temp directory: ${TMP_ROOT}`);

  await createRepoArchive();
  await exportDatabase(env.databaseUrl);
  await fetchVercelSnapshot(env.vercelToken, env.vercelProjectId);
  await createBundleZip();

  if (env.encryptionKey) {
    console.log('[eternal-backup] Encrypting backup bundle with AES-256-GCM');
    await encryptFileInPlace(FINAL_ZIP_PATH, env.encryptionKey);
  } else {
    console.warn(
      '[eternal-backup] ETERNAL_BACKUP_KEY not provided. Uploading bundle without client-side encryption.'
    );
  }

  await uploadToS3(env);
  console.log('[eternal-backup] Backup completed successfully.');
}

function loadEnv(): EnvConfig {
  const required = [
    'DATABASE_URL_PROD',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET_ETERNAL',
    'VERCEL_TOKEN',
    'VERCEL_PROJECT_ID'
  ] as const;

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    databaseUrl: process.env.DATABASE_URL_PROD!,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    awsRegion: process.env.AWS_REGION!,
    awsBucket: process.env.AWS_S3_BUCKET_ETERNAL!,
    vercelToken: process.env.VERCEL_TOKEN!,
    vercelProjectId: process.env.VERCEL_PROJECT_ID!,
    encryptionKey: process.env.ETERNAL_BACKUP_KEY
  };
}

async function createRepoArchive() {
  console.log('[eternal-backup] Creating repository archive');
  await execFileAsync(
    'git',
    ['archive', '--format=zip', 'HEAD', '-o', REPO_ARCHIVE_PATH],
    { cwd: REPO_ROOT }
  );
}

async function exportDatabase(databaseUrl: string) {
  console.log('[eternal-backup] Exporting production database via pg_dump');
  await execFileAsync('pg_dump', [
    '--no-owner',
    '--no-privileges',
    '--format=plain',
    '--column-inserts',
    '--file',
    DB_RAW_PATH,
    databaseUrl
  ]);

  console.log('[eternal-backup] Anonymizing database dump');
  try {
    await sanitizeSqlDump(DB_RAW_PATH, DB_SANITIZED_PATH);
  } finally {
    await fs.rm(DB_RAW_PATH, { force: true });
  }
}

async function fetchVercelSnapshot(token: string, projectId: string) {
  console.log('[eternal-backup] Fetching latest Vercel production deployment');
  const url = new URL('https://api.vercel.com/v6/deployments');
  url.searchParams.set('projectId', projectId);
  url.searchParams.set('target', 'production');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Vercel deployments (status ${response.status}): ${await response.text()}`
    );
  }

  const payload = (await response.json()) as {
    deployments?: Array<Record<string, unknown>>;
  };

  if (!payload.deployments?.length) {
    throw new Error('No production deployments found for the provided Vercel project.');
  }

  const deployment = payload.deployments[0] ?? {};
  const snapshot = {
    id: (deployment.uid as string | undefined) ?? (deployment.id as string | undefined) ?? null,
    url: (deployment.url as string | undefined) ?? null,
    state: deployment.state ?? null,
    createdAt: deployment.created ?? null,
    target: deployment.target ?? 'production',
    commit:
      (deployment as { meta?: Record<string, unknown> }).meta?.['githubCommitSha'] ??
      (deployment as { meta?: Record<string, unknown> }).meta?.['commitSha'] ??
      null,
    raw: deployment
  };

  await fs.writeFile(VERCEL_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf8');
}

async function createBundleZip() {
  console.log('[eternal-backup] Bundling artifacts');
  await fs.rm(FINAL_ZIP_PATH, { force: true });
  const artifacts: Artifact[] = [
    { path: REPO_ARCHIVE_PATH, name: 'apex-intelligence-center.zip' },
    { path: DB_SANITIZED_PATH, name: 'apex-db-anonymized.sql' },
    { path: VERCEL_SNAPSHOT_PATH, name: 'vercel-deployment.json' }
  ];

  await zipArtifacts(artifacts, FINAL_ZIP_PATH);
}

async function zipArtifacts(files: Artifact[], destination: string) {
  await Promise.all(files.map((file) => fs.access(file.path)));

  await new Promise<void>((resolve, reject) => {
    const zipfile = new ZipFile();
    const output = createWriteStream(destination);

    const handleError = (error: Error) => {
      zipfile.end();
      output.destroy();
      reject(error);
    };

    output.on('close', () => resolve());
    output.on('error', handleError);
    zipfile.outputStream.on('error', handleError);

    zipfile.outputStream.pipe(output);

    for (const file of files) {
      zipfile.addFile(file.path, file.name ?? path.basename(file.path));
    }

    zipfile.end();
  });
}

async function sanitizeSqlDump(inputPath: string, outputPath: string) {
  const rl = readline.createInterface({
    input: createReadStream(inputPath),
    crlfDelay: Infinity
  });
  const output = createWriteStream(outputPath, { encoding: 'utf8' });

  const emailCache = new Map<string, string>();
  const nameCache = new Map<string, string>();
  let buffer = '';

  for await (const line of rl) {
    buffer += line + '\n';
    if (line.trim().endsWith(';')) {
      const sanitized = anonymizeStatement(buffer, emailCache, nameCache);
      output.write(sanitized);
      buffer = '';
    }
  }

  if (buffer.trim()) {
    output.write(buffer);
  }

  output.end();
  await once(output, 'close');
}

function anonymizeStatement(
  statement: string,
  emailCache: Map<string, string>,
  nameCache: Map<string, string>
): string {
  const trimmed = statement.trim();
  const match = trimmed.match(
    /^INSERT\s+INTO\s+(.+?)\s*\(([\s\S]+?)\)\s+VALUES\s*\(([\s\S]+)\);$/i
  );

  if (!match) {
    return statement;
  }

  const tableSegment = match[1].trim();
  const columnsSegment = match[2].trim();
  const valuesSegment = match[3].trim();

  const columns = columnsSegment
    .split(',')
    .map((column) => column.trim().replace(/"/g, ''));
  const values = splitSqlValues(valuesSegment);

  if (columns.length !== values.length) {
    return statement;
  }

  const sanitizedValues = values.map((value, index) =>
    sanitizeValue(columns[index], value, emailCache, nameCache)
  );

  return `INSERT INTO ${tableSegment} (${columnsSegment}) VALUES (${sanitizedValues.join(
    ', '
  )});\n`;
}

function splitSqlValues(valuesSegment: string): string[] {
  const values: string[] = [];
  let current = '';
  let inString = false;
  let parenDepth = 0;

  for (let i = 0; i < valuesSegment.length; i += 1) {
    const char = valuesSegment[i];
    const next = valuesSegment[i + 1];

    current += char;

    if (char === `'`) {
      if (!inString) {
        inString = true;
      } else if (next === `'`) {
        current += next;
        i += 1;
      } else {
        inString = false;
      }
      continue;
    }

    if (!inString) {
      if (char === '(') {
        parenDepth += 1;
      } else if (char === ')') {
        parenDepth = Math.max(0, parenDepth - 1);
      } else if (char === ',' && parenDepth === 0) {
        values.push(current.slice(0, -1).trim());
        current = '';
      }
    }
  }

  if (current.trim()) {
    values.push(current.trim());
  }

  return values;
}

function sanitizeValue(
  columnName: string,
  rawValue: string,
  emailCache: Map<string, string>,
  nameCache: Map<string, string>
): string {
  const normalizedColumn = columnName.toLowerCase();
  const normalizedValue = rawValue.trim();

  if (normalizedValue === 'NULL' || normalizedValue === 'DEFAULT') {
    return normalizedValue;
  }

  const literal = parseSqlLiteral(normalizedValue);
  if (!literal) {
    return rawValue;
  }

  if (normalizedColumn.includes('email')) {
    const replacement = anonymizeEmail(literal.value, emailCache);
    return composeSqlLiteral(replacement, literal.prefix, literal.suffix);
  }

  if (
    normalizedColumn.includes('name') ||
    normalizedColumn.includes('username') ||
    normalizedColumn.includes('full_name')
  ) {
    const replacement = anonymizeName(literal.value, nameCache);
    return composeSqlLiteral(replacement, literal.prefix, literal.suffix);
  }

  if (normalizedColumn.includes('phone')) {
    return composeSqlLiteral('0000000000', literal.prefix, literal.suffix);
  }

  if (
    normalizedColumn.includes('address') ||
    normalizedColumn.includes('token') ||
    normalizedColumn.includes('secret') ||
    normalizedColumn.includes('password')
  ) {
    return composeSqlLiteral('REDACTED', literal.prefix, literal.suffix);
  }

  return rawValue;
}

function parseSqlLiteral(value: string): { value: string; prefix: string; suffix: string } | null {
  const literalMatch = value.match(/^(E|U&)?'((?:''|[^'])*)'(.*)$/s);
  if (!literalMatch) {
    return null;
  }

  return {
    prefix: literalMatch[1] ?? '',
    value: literalMatch[2].replace(/''/g, "'"),
    suffix: literalMatch[3] ?? ''
  };
}

function composeSqlLiteral(value: string, prefix: string, suffix: string): string {
  return `${prefix || ''}'${value.replace(/'/g, "''")}'${suffix || ''}`;
}

function anonymizeEmail(email: string, cache: Map<string, string>): string {
  const key = email.toLowerCase();
  if (!cache.has(key)) {
    const digest = createHash('sha256').update(email).digest('hex').slice(0, 12);
    cache.set(key, `anon+${digest}@apex.local`);
  }

  return cache.get(key)!;
}

function anonymizeName(name: string, cache: Map<string, string>): string {
  const key = name.toLowerCase();
  if (!cache.has(key)) {
    const digest = createHash('sha256').update(name).digest('hex').slice(0, 6).toUpperCase();
    cache.set(key, `REDACTED_${digest}`);
  }

  return cache.get(key)!;
}

async function encryptFileInPlace(filePath: string, keyMaterial: string) {
  const tempPath = `${filePath}.enc`;
  const key = createHash('sha256').update(keyMaterial).digest();
  const iv = randomBytes(12);

  await new Promise<void>((resolve, reject) => {
    const input = createReadStream(filePath);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const output = createWriteStream(tempPath);

    const handleError = (error: Error) => {
      input.destroy();
      cipher.destroy();
      output.destroy();
      fs.rm(tempPath, { force: true }).finally(() => reject(error));
    };

    input.on('error', handleError);
    cipher.on('error', handleError);
    output.on('error', handleError);

    output.write(iv);

    cipher.pipe(output, { end: false });
    input.pipe(cipher);

    cipher.on('end', () => {
      try {
        const authTag = cipher.getAuthTag();
        output.write(authTag);
        output.end();
      } catch (error) {
        handleError(error as Error);
      }
    });

    output.on('close', async () => {
      await fs.rm(filePath, { force: true });
      await fs.rename(tempPath, filePath);
      resolve();
    });
  });
}

async function uploadToS3(env: EnvConfig) {
  console.log('[eternal-backup] Uploading encrypted bundle to S3');
  const s3 = new S3Client({
    region: env.awsRegion,
    credentials: {
      accessKeyId: env.awsAccessKeyId,
      secretAccessKey: env.awsSecretAccessKey
    }
  });

  const key = `backups/apex-eternal-backup-${TIMESTAMP}.zip`;
  await s3.send(
    new PutObjectCommand({
      Bucket: env.awsBucket,
      Key: key,
      Body: createReadStream(FINAL_ZIP_PATH),
      ContentType: 'application/zip',
      Metadata: {
        'backup-timestamp': TIMESTAMP,
        encrypted: env.encryptionKey ? 'true' : 'false'
      }
    })
  );

  console.log(`[eternal-backup] Uploaded to s3://${env.awsBucket}/${key}`);
}

function formatTimestamp(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  return `${year}${month}${day}${hours}${minutes}`;
}

main().catch((error) => {
  console.error('[eternal-backup] Backup failed:', error);
  process.exit(1);
});

