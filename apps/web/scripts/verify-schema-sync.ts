import fs from 'node:fs';
import path from 'node:path';

type TableColumns = Record<string, Set<string>>;

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function collectSchemaColumns(schemaPath: string): TableColumns {
  const src = readFile(schemaPath);
  const tables: TableColumns = {};

  // Naive regex to find pgTable definitions: export const tableName = pgTable('table_name', { ... });
  const tableRegex = /export const\s+(\w+)\s*=\s*pgTable\([^,]+,\s*\{([\s\S]*?)\}\s*\)/g;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(src)) !== null) {
    const tableVarName = match[1];
    const columnsBlock = match[2];

    const columnNames = new Set<string>();
    const columnRegex = /^\s*([\w$]+)\s*:/gm;
    let colMatch: RegExpExecArray | null;

    while ((colMatch = columnRegex.exec(columnsBlock)) !== null) {
      const colName = colMatch[1];
      columnNames.add(colName);
    }

    tables[tableVarName] = columnNames;
  }

  return tables;
}

function walk(dir: string, exts: string[], files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and build output
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
      walk(fullPath, exts, files);
    } else {
      if (exts.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function verifyColumnUsage(schemaPath: string, srcRoot: string): void {
  const tables = collectSchemaColumns(schemaPath);
  const exts = ['.ts', '.tsx'];
  const files = walk(srcRoot, exts);

  // Common Drizzle ORM method names to exclude from column checks
  const drizzleMethods = new Set([
    'findMany',
    'findFirst',
    'findUnique',
    'create',
    'update',
    'delete',
    'upsert',
    'count',
    'aggregate',
    'groupBy',
    'getBySlug',
    'getById',
    'getWithLatestPrices',
    'getHighValueWithPrices',
    'listPublic',
    'map',
    'slice',
    'length',
  ]);

  const errors: string[] = [];

  for (const file of files) {
    const content = readFile(file);
    for (const [tableVar, columns] of Object.entries(tables)) {
      // Match table.column patterns but exclude method calls (those followed by '(')
      const usageRegex = new RegExp(`${tableVar}\\.([A-Za-z0-9_]+)(?!\\s*\\()`, 'g');
      let usageMatch: RegExpExecArray | null;

      while ((usageMatch = usageRegex.exec(content)) !== null) {
        const col = usageMatch[1];

        // Skip if it's a known Drizzle method or if it's followed by a parenthesis (method call)
        if (drizzleMethods.has(col)) continue;

        // Check if the next character after the match is a parenthesis (indicating a method call)
        const matchEnd = usageMatch.index + usageMatch[0].length;
        const afterMatch = content.slice(matchEnd, matchEnd + 10).trim();
        if (afterMatch.startsWith('(')) continue;

        if (!columns.has(col)) {
          errors.push(
            `Unknown column reference: ${tableVar}.${col} in ${path.relative(
              process.cwd(),
              file,
            )}`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('❌ Schema/code sync verification failed:');
    for (const err of errors) {
      // eslint-disable-next-line no-console
      console.error(`  - ${err}`);
    }
    process.exit(1);
  } else {
    // eslint-disable-next-line no-console
    console.log('✅ Schema/code sync verification passed (no unknown column references).');
  }
}

function main() {
  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.ts');
  const srcRoot = path.join(process.cwd(), 'src');

  if (!fs.existsSync(schemaPath)) {
    // eslint-disable-next-line no-console
    console.error(`Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  verifyColumnUsage(schemaPath, srcRoot);
}

main();

