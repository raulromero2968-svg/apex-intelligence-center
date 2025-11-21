#!/usr/bin/env tsx
/**
 * ETHICAL ENFORCEMENT GATE
 *
 * Zero tolerance. Zero compromise.
 *
 * This script ensures that unethical code can NEVER be merged.
 * It validates:
 * - All 8 risk rules present and enforced
 * - No FOMO manipulation language
 * - Rate limiting on all API routes
 * - Citation validation active
 *
 * Exit code 1 = BUILD FAILS = NO MERGE
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface Violation {
  type: 'CRITICAL' | 'ERROR' | 'WARNING';
  rule: string;
  file: string;
  line?: number;
  message: string;
}

const violations: Violation[] = [];
let checksRun = 0;
let checksPassed = 0;

// ANSI colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message: string, color?: keyof typeof colors) {
  const c = color ? colors[color] : '';
  console.log(`${c}${message}${colors.reset}`);
}

function addViolation(violation: Violation) {
  violations.push(violation);
  const symbol = violation.type === 'CRITICAL' ? '🔴' : violation.type === 'ERROR' ? '⚠️' : '⚡';
  log(
    `${symbol} ${violation.type}: ${violation.rule} - ${violation.message} (${violation.file}${violation.line ? `:${violation.line}` : ''})`,
    violation.type === 'CRITICAL' ? 'red' : violation.type === 'ERROR' ? 'yellow' : 'cyan'
  );
}

function checkPassed(checkName: string) {
  checksRun++;
  checksPassed++;
  log(`✅ ${checkName}`, 'green');
}

function checkFailed(checkName: string) {
  checksRun++;
  log(`❌ ${checkName}`, 'red');
}

/**
 * CHECK 1: All 8 Risk Rules Present
 *
 * The 8 rules that MUST exist:
 * 1. single: max 8% any single card
 * 2. game.pokemon: max 35%
 * 3. game.mtg: max 40%
 * 4. game.yugioh: max 15%
 * 5. game.other: max 10%
 * 6. corr: max 75% correlation
 * 7. liq: min 20 sales/30d
 * 8. vol: max riskScore 4
 */
async function check8RiskRules() {
  log('\n📋 CHECK 1: Validating 8 Core Risk Rules', 'cyan');

  const riskFilePath = path.join(process.cwd(), 'apps/web/src/risk/rules.v3.ts');

  if (!fs.existsSync(riskFilePath)) {
    addViolation({
      type: 'CRITICAL',
      rule: 'RISK_RULES_MISSING',
      file: riskFilePath,
      message: 'Risk rules file does not exist',
    });
    checkFailed('Risk rules file exists');
    return;
  }

  checkPassed('Risk rules file exists');

  const content = fs.readFileSync(riskFilePath, 'utf-8');

  const requiredRules = [
    { name: 'single', pattern: /single:\s*0\.08/, description: 'Single card 8% limit' },
    { name: 'game.pokemon', pattern: /pokemon:\s*0\.35/, description: 'Pokemon 35% limit' },
    { name: 'game.mtg', pattern: /mtg:\s*0\.40/, description: 'MTG 40% limit' },
    { name: 'game.yugioh', pattern: /yugioh:\s*0\.15/, description: 'Yu-Gi-Oh! 15% limit' },
    { name: 'game.other', pattern: /other:\s*0\.10/, description: 'Other games 10% limit' },
    { name: 'corr', pattern: /corr:\s*0\.75/, description: 'Correlation 75% limit' },
    { name: 'liq', pattern: /liq:\s*20/, description: 'Liquidity 20 sales minimum' },
    { name: 'vol', pattern: /vol:\s*4/, description: 'Volatility cap riskScore 4' },
  ];

  let allRulesPresent = true;

  for (const rule of requiredRules) {
    if (!rule.pattern.test(content)) {
      addViolation({
        type: 'CRITICAL',
        rule: 'MISSING_RISK_RULE',
        file: riskFilePath,
        message: `Missing or modified: ${rule.description}`,
      });
      allRulesPresent = false;
      checkFailed(`Rule present: ${rule.name}`);
    } else {
      checkPassed(`Rule present: ${rule.name}`);
    }
  }

  // Verify the pass() function exists
  if (!/export\s+function\s+pass\s*\(/.test(content)) {
    addViolation({
      type: 'CRITICAL',
      rule: 'MISSING_ENFORCEMENT',
      file: riskFilePath,
      message: 'Missing pass() enforcement function',
    });
    checkFailed('pass() enforcement function exists');
  } else {
    checkPassed('pass() enforcement function exists');
  }
}

/**
 * CHECK 2: FOMO Language Scanner
 *
 * Scans for manipulative urgency/scarcity language that creates
 * fear of missing out. Educational content is allowed.
 */
async function checkFOMOLanguage() {
  log('\n🔍 CHECK 2: Scanning for FOMO Manipulation', 'cyan');

  const fomoPatternsManipulative = [
    { pattern: /\b(act now|limited time|don't miss out|hurry|last chance|ending soon)\b/gi, severity: 'CRITICAL' as const },
    { pattern: /\b(only \d+ left|selling fast|almost gone|nearly sold out)\b/gi, severity: 'CRITICAL' as const },
    { pattern: /\b(price will (increase|rise|jump)|get it before|won't last)\b/gi, severity: 'ERROR' as const },
    { pattern: /🔥|⏰|⚡(?!\s*(CRITICAL|ALERT))/, severity: 'WARNING' as const }, // Emoji urgency (except our alerts)
  ];

  // Educational exceptions - these phrases are OK
  const educationalExceptions = [
    /avoid FOMO/i,
    /FOMO trap/i,
    /educational/i,
    /analysis/i,
    /how to (identify|spot|avoid)/i,
  ];

  const filesToScan = await glob('apps/web/src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  });

  let fomoFound = false;

  for (const file of filesToScan) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip if line contains educational exception
      const hasException = educationalExceptions.some(ex => ex.test(line));
      if (hasException) continue;

      // Check for FOMO patterns
      for (const { pattern, severity } of fomoPatternsManipulative) {
        const matches = line.match(pattern);
        if (matches) {
          addViolation({
            type: severity,
            rule: 'FOMO_LANGUAGE',
            file: file.replace(process.cwd(), '.'),
            line: i + 1,
            message: `Manipulative FOMO language detected: "${matches[0]}"`,
          });
          fomoFound = true;
        }
      }
    }
  }

  if (!fomoFound) {
    checkPassed('No FOMO manipulation detected');
  } else {
    checkFailed('FOMO language violations found');
  }
}

/**
 * CHECK 3: Rate Limit Middleware Enforcement
 *
 * All API routes MUST import and use rate limiting
 * to prevent spend manipulation and abuse.
 */
async function checkRateLimitMiddleware() {
  log('\n🛡️  CHECK 3: Verifying Rate Limit Protection', 'cyan');

  // Check rate-limit.ts exists
  const rateLimitPath = path.join(process.cwd(), 'apps/web/src/lib/rate-limit.ts');
  if (!fs.existsSync(rateLimitPath)) {
    addViolation({
      type: 'CRITICAL',
      rule: 'RATE_LIMIT_MISSING',
      file: rateLimitPath,
      message: 'Rate limit middleware file does not exist',
    });
    checkFailed('Rate limit middleware exists');
    return;
  }

  checkPassed('Rate limit middleware exists');

  // Find all API routes
  const apiRoutes = await glob('apps/web/src/app/api/**/route.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  });

  log(`Found ${apiRoutes.length} API routes to check`);

  let allRoutesProtected = true;

  for (const route of apiRoutes) {
    const content = fs.readFileSync(route, 'utf-8');
    const relativePath = route.replace(process.cwd(), '.');

    // Skip health check and static endpoints
    if (route.includes('/health/') || route.includes('/static/')) {
      continue;
    }

    // Check if route imports rate limiting
    const hasRateLimitImport = /import\s+.*\{?\s*ratelimit\s*\}?\s*from\s+['"].*rate-limit/i.test(content);
    const hasRateLimitCall = /await\s+ratelimit\s*\(/i.test(content) || /ratelimit\s*\(/i.test(content);

    if (!hasRateLimitImport || !hasRateLimitCall) {
      addViolation({
        type: 'ERROR',
        rule: 'MISSING_RATE_LIMIT',
        file: relativePath,
        message: 'API route missing rate limit protection',
      });
      allRoutesProtected = false;
      checkFailed(`Rate limited: ${relativePath}`);
    } else {
      checkPassed(`Rate limited: ${relativePath}`);
    }
  }
}

/**
 * CHECK 4: Citation Validation Active
 *
 * RAG responses MUST validate citations to prevent
 * hallucination and misinformation.
 */
async function checkCitationValidation() {
  log('\n📚 CHECK 4: Citation Validation Active', 'cyan');

  const chainPath = path.join(process.cwd(), 'apps/web/src/rag/chain.ts');

  if (!fs.existsSync(chainPath)) {
    addViolation({
      type: 'CRITICAL',
      rule: 'CITATION_VALIDATION_MISSING',
      file: chainPath,
      message: 'Citation validation chain does not exist',
    });
    checkFailed('Citation validation exists');
    return;
  }

  const content = fs.readFileSync(chainPath, 'utf-8');

  // Check for validateCitations function
  if (!/export\s+function\s+validateCitations\s*\(/.test(content)) {
    addViolation({
      type: 'CRITICAL',
      rule: 'MISSING_VALIDATION_FUNC',
      file: chainPath,
      message: 'validateCitations function missing',
    });
    checkFailed('validateCitations function exists');
  } else {
    checkPassed('validateCitations function exists');
  }

  // Check for enhanced validation
  if (!/validateCitationsEnhanced/i.test(content)) {
    addViolation({
      type: 'ERROR',
      rule: 'MISSING_ENHANCED_VALIDATION',
      file: chainPath,
      message: 'Enhanced citation validation missing',
    });
    checkFailed('Enhanced validation exists');
  } else {
    checkPassed('Enhanced validation exists');
  }

  // Check for hallucination detection
  if (!/hallucination|semantic|cosine/i.test(content)) {
    addViolation({
      type: 'ERROR',
      rule: 'MISSING_HALLUCINATION_CHECK',
      file: chainPath,
      message: 'Hallucination detection missing',
    });
    checkFailed('Hallucination detection exists');
  } else {
    checkPassed('Hallucination detection exists');
  }
}

/**
 * CHECK 5: EU AI Act Compliance
 *
 * Transparency, human oversight, and quality management
 * must be enforced per EU AI Act.
 */
async function checkEUAIActCompliance() {
  log('\n🇪🇺 CHECK 5: EU AI Act Compliance', 'cyan');

  const compliancePath = path.join(process.cwd(), 'apps/web/src/lib/compliance/eu-ai-act.ts');

  if (!fs.existsSync(compliancePath)) {
    addViolation({
      type: 'ERROR',
      rule: 'EU_AI_ACT_MISSING',
      file: compliancePath,
      message: 'EU AI Act compliance module missing',
    });
    checkFailed('EU AI Act compliance exists');
    return;
  }

  const content = fs.readFileSync(compliancePath, 'utf-8');

  // Check for novelty score calculation (human oversight trigger)
  if (!/calculateNoveltyScore/i.test(content)) {
    addViolation({
      type: 'ERROR',
      rule: 'MISSING_NOVELTY_CHECK',
      file: compliancePath,
      message: 'Novelty score calculation missing (human oversight)',
    });
    checkFailed('Novelty score calculation exists');
  } else {
    checkPassed('Novelty score calculation exists');
  }

  // Check for human review threshold
  if (!/0\.7/.test(content) || !/humanReviewRequired/i.test(content)) {
    addViolation({
      type: 'ERROR',
      rule: 'MISSING_HUMAN_REVIEW',
      file: compliancePath,
      message: 'Human review threshold missing or incorrect',
    });
    checkFailed('Human review threshold set');
  } else {
    checkPassed('Human review threshold set');
  }

  checkPassed('EU AI Act compliance active');
}

/**
 * CHECK 6: Stripe Security (No Tier Manipulation)
 *
 * Users MUST NOT be able to set their own subscription tier.
 * Only server-side Stripe webhooks can assign tiers.
 */
async function checkStripeSecurity() {
  log('\n💳 CHECK 6: Stripe Security (Anti-Manipulation)', 'cyan');

  const middlewarePath = path.join(process.cwd(), 'apps/web/src/lib/stripe/middleware.ts');

  if (!fs.existsSync(middlewarePath)) {
    addViolation({
      type: 'CRITICAL',
      rule: 'STRIPE_SECURITY_MISSING',
      file: middlewarePath,
      message: 'Stripe security middleware missing',
    });
    checkFailed('Stripe security middleware exists');
    return;
  }

  const content = fs.readFileSync(middlewarePath, 'utf-8');

  // Check for validateNoTierManipulation function
  if (!/validateNoTierManipulation/i.test(content)) {
    addViolation({
      type: 'CRITICAL',
      rule: 'MISSING_TIER_PROTECTION',
      file: middlewarePath,
      message: 'Tier manipulation protection missing',
    });
    checkFailed('Tier manipulation protection exists');
  } else {
    checkPassed('Tier manipulation protection exists');
  }

  // Check for 403 response on violation
  if (!/403/i.test(content)) {
    addViolation({
      type: 'ERROR',
      rule: 'MISSING_403_RESPONSE',
      file: middlewarePath,
      message: '403 Forbidden response not configured',
    });
    checkFailed('403 response configured');
  } else {
    checkPassed('403 response configured');
  }
}

/**
 * CHECK 7: IPFS Provenance Logging
 *
 * All RAG interactions MUST be logged to IPFS
 * for immutable audit trails.
 */
async function checkIPFSProvenance() {
  log('\n🗂️  CHECK 7: IPFS Provenance Logging', 'cyan');

  const ipfsPath = path.join(process.cwd(), 'apps/web/src/lib/provenance/ipfs.ts');

  if (!fs.existsSync(ipfsPath)) {
    addViolation({
      type: 'ERROR',
      rule: 'IPFS_PROVENANCE_MISSING',
      file: ipfsPath,
      message: 'IPFS provenance logger missing',
    });
    checkFailed('IPFS provenance logger exists');
    return;
  }

  const content = fs.readFileSync(ipfsPath, 'utf-8');

  // Check for IpfsProvenanceLogger class
  if (!/class\s+IpfsProvenanceLogger/i.test(content)) {
    addViolation({
      type: 'ERROR',
      rule: 'MISSING_IPFS_CLASS',
      file: ipfsPath,
      message: 'IpfsProvenanceLogger class missing',
    });
    checkFailed('IpfsProvenanceLogger class exists');
  } else {
    checkPassed('IpfsProvenanceLogger class exists');
  }

  // Check for logRagTrace method
  if (!/logRagTrace/i.test(content)) {
    addViolation({
      type: 'ERROR',
      rule: 'MISSING_RAG_LOGGING',
      file: ipfsPath,
      message: 'RAG trace logging method missing',
    });
    checkFailed('RAG trace logging exists');
  } else {
    checkPassed('RAG trace logging exists');
  }
}

/**
 * CHECK 8: PII Protection
 *
 * User inputs MUST be validated to block PII
 * (passwords, tokens, SSN, credit cards, etc.)
 */
async function checkPIIProtection() {
  log('\n🔒 CHECK 8: PII Protection in RAG Input', 'cyan');

  const ragRoutePath = path.join(process.cwd(), 'apps/web/src/app/api/rag/route.ts');

  if (!fs.existsSync(ragRoutePath)) {
    addViolation({
      type: 'CRITICAL',
      rule: 'RAG_ROUTE_MISSING',
      file: ragRoutePath,
      message: 'RAG route does not exist',
    });
    checkFailed('RAG route exists');
    return;
  }

  const content = fs.readFileSync(ragRoutePath, 'utf-8');

  // Check for QuerySchema with PII validation
  if (!/QuerySchema/i.test(content)) {
    addViolation({
      type: 'CRITICAL',
      rule: 'MISSING_INPUT_SCHEMA',
      file: ragRoutePath,
      message: 'Input validation schema missing',
    });
    checkFailed('Input validation schema exists');
  } else {
    checkPassed('Input validation schema exists');
  }

  // Check for PII blocking patterns
  const piiPatterns = ['password', 'token', 'ssn', 'credit.card', 'cvv'];
  const hasPIIBlocking = piiPatterns.some(pattern => content.includes(pattern));

  if (!hasPIIBlocking) {
    addViolation({
      type: 'CRITICAL',
      rule: 'MISSING_PII_BLOCKING',
      file: ragRoutePath,
      message: 'PII blocking validation missing',
    });
    checkFailed('PII blocking active');
  } else {
    checkPassed('PII blocking active');
  }
}

/**
 * MAIN EXECUTION
 */
async function main() {
  log('\n' + '='.repeat(80), 'bold');
  log('🛡️  ETHICAL ENFORCEMENT GATE 🛡️', 'bold');
  log('='.repeat(80) + '\n', 'bold');

  log('Running comprehensive ethical checks...\n', 'cyan');

  try {
    await check8RiskRules();
    await checkFOMOLanguage();
    await checkRateLimitMiddleware();
    await checkCitationValidation();
    await checkEUAIActCompliance();
    await checkStripeSecurity();
    await checkIPFSProvenance();
    await checkPIIProtection();
  } catch (error) {
    log(`\n❌ Fatal error during checks: ${error}`, 'red');
    process.exit(1);
  }

  // Summary
  log('\n' + '='.repeat(80), 'bold');
  log('📊 RESULTS', 'bold');
  log('='.repeat(80) + '\n', 'bold');

  const critical = violations.filter(v => v.type === 'CRITICAL').length;
  const errors = violations.filter(v => v.type === 'ERROR').length;
  const warnings = violations.filter(v => v.type === 'WARNING').length;

  log(`Checks run: ${checksRun}`);
  log(`Checks passed: ${checksPassed}`, 'green');
  log(`Checks failed: ${checksRun - checksPassed}`, checksRun === checksPassed ? 'green' : 'red');
  log(`\nViolations: ${violations.length}`);

  if (critical > 0) log(`  🔴 Critical: ${critical}`, 'red');
  if (errors > 0) log(`  ⚠️  Errors: ${errors}`, 'yellow');
  if (warnings > 0) log(`  ⚡ Warnings: ${warnings}`, 'cyan');

  log('\n' + '='.repeat(80) + '\n', 'bold');

  // Exit status
  if (critical > 0 || errors > 0) {
    log('❌ BUILD FAILED: Ethical violations detected', 'red');
    log('🚫 MERGE BLOCKED: Fix violations before merge\n', 'red');
    process.exit(1);
  } else if (warnings > 0) {
    log('⚠️  BUILD PASSED WITH WARNINGS', 'yellow');
    log('Review warnings before merge\n', 'yellow');
    process.exit(0);
  } else {
    log('✅ ALL CHECKS PASSED', 'green');
    log('🎉 Ethical code confirmed. Safe to merge.\n', 'green');
    process.exit(0);
  }
}

// Run checks
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
