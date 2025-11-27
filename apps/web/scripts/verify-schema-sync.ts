import fs from 'node:fs';
import path from 'node:path';

type TableColumns = Record<string, Set<string>>;

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function collectSchemaColumns(schemaPath: string): TableColumns {
  const src = readFile(schemaPath);
  const tables: TableColumns = {};

  // Find pgTable definitions: export const tableName = pgTable('table_name', { ... });
  const tableRegex = /export const\s+(\w+)\s*=\s*pgTable\([^,]+,\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(src)) !== null) {
    const tableVarName = match[1];
    const startPos = match.index + match[0].length;
    
    // Find the matching closing brace for the column definition block
    let braceCount = 1;
    let pos = startPos;
    let columnsBlockEnd = startPos;
    
    while (pos < src.length && braceCount > 0) {
      if (src[pos] === '{') braceCount++;
      else if (src[pos] === '}') braceCount--;
      if (braceCount === 0) {
        columnsBlockEnd = pos;
        break;
      }
      pos++;
    }
    
    const columnsBlock = src.slice(startPos, columnsBlockEnd);

    const columnNames = new Set<string>();
    // More robust regex: match column names at start of line (with optional whitespace) or after comma/newline
    const columnRegex = /(?:^|\n|,)\s*([\w$]+)\s*:/gm;
    let colMatch: RegExpExecArray | null;

    while ((colMatch = columnRegex.exec(columnsBlock)) !== null) {
      const colName = colMatch[1];
      // Skip if it's a TypeScript keyword or common non-column patterns
      if (colName === 'table' || colName === 'export' || colName === 'const') continue;
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
      // Match table.column patterns - we'll filter out method calls after matching
      const usageRegex = new RegExp(`${tableVar}\\.([A-Za-z0-9_]+)`, 'g');
      let usageMatch: RegExpExecArray | null;

      while ((usageMatch = usageRegex.exec(content)) !== null) {
        const col = usageMatch[1];
        const matchStart = usageMatch.index;

        // Skip if it's a known Drizzle method
        if (drizzleMethods.has(col)) continue;

        // Check if followed by a parenthesis (indicating a method call)
        const matchEnd = matchStart + usageMatch[0].length;
        const afterMatch = content.slice(matchEnd);
        // Look for optional whitespace followed by '('
        if (/^\s*\(/.test(afterMatch)) continue;

        // Skip if inside a SQL template literal (sql`...` or sql.raw(...))
        // Check backwards from match position for sql` or sql.raw
        const beforeMatch = content.slice(Math.max(0, matchStart - 50), matchStart);
        if (/sql[`.]/.test(beforeMatch)) {
          // Find the start of the SQL template
          const sqlStart = beforeMatch.lastIndexOf('sql');
          if (sqlStart >= 0) {
            const sqlContext = beforeMatch.slice(sqlStart);
            // If it's sql` or sql.raw, skip this match
            if (sqlContext.includes('sql`') || sqlContext.includes('sql.raw')) continue;
          }
        }

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


