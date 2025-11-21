# NO FOMO Language Policy

## Policy Statement

**Effective Date: November 21, 2025**

All FOMO (Fear of Missing Out) language is **permanently banned** from the Apex Intelligence Center codebase. This includes all source code, MDX content, documentation, and any text files in the repository.

## Banned Phrases

The following phrases are prohibited and will cause the build to fail:

- "limited time"
- "ending soon"
- "last chance"
- "act now"
- "don't miss"
- "only X left" (including "only 1 left", "only 2 left", etc.)
- "few remaining"
- "few left"
- "flash sale"
- "urgent"

## Enforcement

### Automated Checks

1. **ESLint Rule**: Custom ESLint rule `rulesdir/no-fomo-language` scans all JavaScript, TypeScript, JSX, TSX, and MDX files
2. **Standalone Script**: `scripts/check-fomo-language.js` performs comprehensive scans of all text files
3. **CI/CD Integration**: FOMO checks run on every pull request and must pass before merge

### CI Pipeline

The FOMO check is integrated into:
- Dedicated FOMO workflow (`.github/workflows/no-fomo.yml`)
- PR CI workflow (`.github/workflows/pr-ci.yml`)
- Constitution workflow (`.github/workflows/constitution.yml`)
- Main CI script (`pnpm ci`)
- Golden build script (`pnpm golden`)

### Build Blocking

**PRs cannot merge with FOMO copy. Ever.**

Any commit containing FOMO language will:
1. Fail the CI/CD pipeline
2. Block the pull request from merging
3. Require immediate remediation

## Usage

### Check for FOMO Language

```bash
# Check entire codebase
pnpm check:fomo

# Check only MDX files
pnpm check:fomo:mdx

# Check specific files or directories
node scripts/check-fomo-language.js path/to/file.ts
node scripts/check-fomo-language.js apps/web/src/
```

### Run ESLint

```bash
# Lint with FOMO rule included
pnpm lint
```

## Rationale

FOMO language creates artificial urgency and pressure that:
- Undermines trust with users
- Manipulates decision-making
- Degrades user experience
- Contradicts our commitment to providing objective, data-driven intelligence

Apex Intelligence Center is committed to building a platform based on trust, transparency, and long-term value—not psychological manipulation.

## Exceptions

**None.** This policy has no exceptions. All FOMO language must be removed.

## Questions?

Contact the development team or open an issue if you have questions about this policy or need help removing FOMO language from your code.

---

**Last Updated**: November 21, 2025
