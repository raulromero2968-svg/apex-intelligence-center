# Schema Synchronization System

## Overview

The Apex Intelligence Schema Synchronization System ensures that database schema definitions remain in sync with the codebase, preventing runtime errors and maintaining data integrity.

## Components

### 1. Verification Script (`apps/web/scripts/verify-schema-sync.ts`)

Comprehensive verification script that checks:

- **Column References**: Ensures all `table.column` references in code match schema definitions
- **Migration Sync**: Verifies migrations are up-to-date with schema changes
- **Drizzle Config**: Validates drizzle.config.ts settings
- **SQL Injection Prevention**: Detects potentially unsafe SQL interpolation patterns
- **Schema Quality**: Checks for best practices (timestamps, indexes, etc.)

#### Features

- Colored terminal output for easy reading
- Detailed error and warning reporting
- Comprehensive statistics
- Exits with proper status codes for CI/CD integration

### 2. Drizzle Configuration (`apps/web/drizzle.config.ts`)

Enhanced configuration with:

- **Strict Mode**: Enabled to catch schema inconsistencies early
- **Verbose Output**: Better debugging information
- **Proper Dialect**: PostgreSQL with correct connection settings

### 3. GitHub Actions Workflow (`.github/workflows/schema-verification.yml`)

Automated verification that runs on:

- Every push to main branch (when schema files change)
- All pull requests (when schema files change)

The workflow:
- Runs schema sync verification
- Checks Drizzle syntax
- Verifies migration status
- Comments on PRs if verification fails
- Generates detailed job summaries

### 4. Pre-commit Hooks (Husky + lint-staged)

Local validation before commits using:

- **Husky**: Git hooks manager
- **lint-staged**: Runs checks only on staged files

Configuration in `.lintstagedrc.json`:
- Runs schema verification when `schema.ts` changes
- Runs Drizzle checks when config changes
- Lints TypeScript files
- Formats JSON, Markdown, YAML files

## Usage

### Running Verification Manually

```bash
# Run full schema verification
pnpm verify:schema

# Run only schema sync check
pnpm verify:schema-sync

# Run only Drizzle syntax check
pnpm verify:drizzle-syntax
```

### Making Schema Changes

When modifying `apps/web/src/db/schema.ts`:

1. **Make your changes** to the schema file
2. **Generate migration**:
   ```bash
   pnpm db:generate
   ```
3. **Verify sync**:
   ```bash
   pnpm verify:schema
   ```
4. **Commit changes** (pre-commit hook will run automatically)

### Understanding Verification Output

The script provides colored output:

- 🔍 **Blue**: Informational messages
- ✅ **Green**: Success
- ⚠️ **Yellow**: Warnings (won't fail build)
- ❌ **Red**: Errors (will fail build)

#### Error Types

**Errors** (will fail CI/CD):
- Unknown column references in code
- Schema modified after latest migration
- Missing drizzle config
- SQL injection vulnerabilities

**Warnings** (won't fail CI/CD):
- Possible unsafe SQL patterns
- Missing timestamps on tables
- Missing output directory in config

### CI/CD Integration

The system is integrated into the build pipeline:

1. **On every commit**: Pre-commit hook runs verification
2. **On PR creation**: GitHub Actions runs full verification
3. **On main branch push**: Full verification before deployment

If verification fails:
- Build will stop
- Detailed error messages are displayed
- PR will get an automated comment with fix instructions

## Configuration Files

### `.lintstagedrc.json`

Controls what checks run on staged files:

```json
{
  "apps/web/src/db/schema.ts": [
    "pnpm --filter web exec tsx scripts/verify-schema-sync.ts",
    "pnpm --filter web exec drizzle-kit check"
  ],
  "apps/web/**/*.{ts,tsx}": [
    "pnpm --filter web lint --fix"
  ],
  "apps/web/drizzle.config.ts": [
    "pnpm --filter web exec drizzle-kit check"
  ]
}
```

### `.husky/pre-commit`

Simple hook that triggers lint-staged:

```bash
pnpm lint-staged
```

## Troubleshooting

### "Schema file modified after latest migration"

**Fix**: Generate a new migration
```bash
pnpm db:generate
```

### "Unknown column reference: tableName.columnName"

**Fix**: Either:
1. Add the column to the schema definition
2. Remove the reference from your code
3. Fix the typo in the column name

### "Possible unsafe SQL interpolation"

**Fix**: Use parameterized queries:
```typescript
// ❌ Bad
sql`SELECT * FROM users WHERE id = ${userId}`

// ✅ Good
sql`SELECT * FROM users WHERE id = ${sql.placeholder('userId')}`
```

### "Table missing updated_at timestamp"

**Fix**: Add timestamp to table definition:
```typescript
export const myTable = pgTable('my_table', {
  // ... other columns
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

### Pre-commit Hook Not Running

**Fix**: Reinstall hooks
```bash
pnpm prepare
```

## Best Practices

1. **Always generate migrations** after schema changes
2. **Run verification locally** before pushing
3. **Add timestamps** to all tables (created_at, updated_at)
4. **Use parameterized queries** to prevent SQL injection
5. **Keep schema and migrations in sync**
6. **Address warnings** even if they don't fail the build

## Statistics

The verification script provides comprehensive statistics:

- **Tables**: Total number of tables defined
- **Columns**: Total number of columns across all tables
- **Files**: Number of TypeScript files scanned
- **Errors**: Number of critical issues found
- **Warnings**: Number of non-critical issues found

## Maintenance

### Adding New Checks

To add new verification checks, edit `apps/web/scripts/verify-schema-sync.ts`:

1. Create a new verification function
2. Add it to the `main()` function
3. Push issues to the `allIssues` array
4. Test thoroughly before committing

### Updating Drizzle Methods

If new Drizzle ORM methods are added, update the `drizzleMethods` set in `verify-schema-sync.ts` to prevent false positives.

### Customizing lint-staged

Edit `.lintstagedrc.json` to:
- Add new file patterns
- Change which checks run
- Add additional validation steps

## Benefits

✅ **Prevents Runtime Errors**: Catch schema mismatches before deployment
✅ **Maintains Data Integrity**: Ensures migrations are always in sync
✅ **Improves Code Quality**: Enforces best practices and patterns
✅ **Saves Development Time**: Catches issues early in development
✅ **Enhances Security**: Detects potential SQL injection vulnerabilities
✅ **Better Developer Experience**: Clear error messages and automated checks

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the error messages carefully
3. Run `pnpm verify:schema` for detailed output
4. Check GitHub Actions logs for CI/CD failures

---

**Last Updated**: November 2025
**Maintained by**: Apex Intelligence Team
