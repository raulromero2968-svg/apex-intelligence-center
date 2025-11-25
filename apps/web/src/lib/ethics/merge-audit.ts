/**
 * Merge Audit - Ethics compliance for code merges
 *
 * Integrates with git conflict resolution to ensure:
 * - Automated merges don't introduce ethics violations
 * - Job impact assessment for merge automation
 * - Audit trail for compliance
 *
 * @see pack-ai-defense-001 for resilience patterns
 * @see scripts/resolve-conflicts.sh for integration
 */

import { db } from '@/db';
import { ethicsAudits, jobImpacts, hitlRecords } from '@/db/schema/ethics';
import { eq, desc } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

interface MergeContext {
  branch?: string;
  filesChanged?: number;
  conflictsResolved?: number;
  strategy?: 'theirs' | 'ours' | 'manual';
  teamSize?: number;
  automationLevel?: 'full' | 'partial' | 'manual';
}

interface MergeAuditResult {
  status: 'success' | 'warning' | 'failed';
  category: 'low' | 'medium' | 'high';
  details: {
    jobImpact: number;
    automationScore: number;
    riskFactors: string[];
    recommendations: string[];
  };
  auditId?: string;
  timestamp: string;
}

// ============================================================================
// JOB IMPACT ASSESSMENT
// ============================================================================

/**
 * Assess the job impact of a merge automation action
 */
export async function assessMergeJobImpact(
  actionType: string,
  context: MergeContext
): Promise<{
  category: 'low' | 'medium' | 'high';
  score: number;
  details: string;
}> {
  // Calculate impact based on context
  let impactScore = 0;
  const factors: string[] = [];

  // Automation level impact
  switch (context.automationLevel) {
    case 'full':
      impactScore += 30;
      factors.push('Full automation - higher displacement risk');
      break;
    case 'partial':
      impactScore += 15;
      factors.push('Partial automation - moderate displacement risk');
      break;
    case 'manual':
      impactScore += 5;
      factors.push('Manual process - low displacement risk');
      break;
  }

  // Files changed impact
  if (context.filesChanged) {
    if (context.filesChanged > 50) {
      impactScore += 20;
      factors.push('Large changeset - significant review effort saved');
    } else if (context.filesChanged > 20) {
      impactScore += 10;
      factors.push('Moderate changeset - some review effort saved');
    }
  }

  // Conflicts resolved impact
  if (context.conflictsResolved) {
    if (context.conflictsResolved > 10) {
      impactScore += 15;
      factors.push('Many conflicts auto-resolved');
    } else if (context.conflictsResolved > 5) {
      impactScore += 8;
      factors.push('Some conflicts auto-resolved');
    }
  }

  // Team size impact (larger teams = more impact from automation)
  if (context.teamSize) {
    if (context.teamSize > 50) {
      impactScore += 10;
      factors.push('Large team - broad automation impact');
    } else if (context.teamSize > 20) {
      impactScore += 5;
      factors.push('Medium team - moderate automation impact');
    }
  }

  // Determine category
  let category: 'low' | 'medium' | 'high';
  if (impactScore >= 50) {
    category = 'high';
  } else if (impactScore >= 25) {
    category = 'medium';
  } else {
    category = 'low';
  }

  return {
    category,
    score: impactScore,
    details: factors.join('; '),
  };
}

// ============================================================================
// MERGE AUDIT
// ============================================================================

/**
 * Audit merge changes for ethics compliance
 *
 * Called by resolve-conflicts.sh after merge resolution.
 * Records audit trail and assesses job impact.
 */
export async function auditMergeChanges(
  context?: MergeContext
): Promise<MergeAuditResult> {
  const timestamp = new Date().toISOString();
  const mergeContext = context || {
    automationLevel: 'partial',
    teamSize: 10,
  };

  try {
    // Assess job impact
    const impact = await assessMergeJobImpact('code_merge', mergeContext);

    // Generate risk factors and recommendations
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    if (impact.category === 'high') {
      riskFactors.push('High automation impact detected');
      recommendations.push('Consider reskilling training for affected team members');
      recommendations.push('Review automation scope with leadership');
    }

    if (mergeContext.strategy === 'theirs') {
      riskFactors.push('Auto-accept strategy may override intentional changes');
      recommendations.push('Review merged files for unintended overwrites');
    }

    if ((mergeContext.filesChanged || 0) > 30) {
      riskFactors.push('Large changeset may introduce subtle issues');
      recommendations.push('Thorough code review recommended');
    }

    // Calculate automation score (0-100)
    const automationScore =
      mergeContext.automationLevel === 'full' ? 90 :
      mergeContext.automationLevel === 'partial' ? 50 : 10;

    // Store audit record (if database available)
    let auditId: string | undefined;
    try {
      const [audit] = await db
        .insert(ethicsAudits)
        .values({
          auditType: 'merge_automation',
          status: impact.category === 'high' ? 'requires_review' : 'passed',
          score: 100 - impact.score, // Invert for compliance score
          findings: {
            jobImpact: impact,
            context: mergeContext,
            riskFactors,
            recommendations,
          },
          auditorId: 'system',
        })
        .returning();

      auditId = audit?.id;

      // Record job impact
      await db.insert(jobImpacts).values({
        category: impact.category,
        actionType: 'code_merge',
        description: `Automated merge resolution: ${impact.details}`,
        assessedRisk: impact.score / 100,
        mitigationPlan:
          impact.category === 'high'
            ? 'Provide reskilling opportunities; Implement gradual automation rollout'
            : 'Standard monitoring; No immediate action required',
      });
    } catch (dbError) {
      // Database may not be available in CLI context
      console.warn('[Merge Audit] Database not available - audit not persisted');
    }

    // Determine overall status
    let status: 'success' | 'warning' | 'failed';
    if (impact.category === 'high') {
      status = 'warning';
      console.warn('\n[Merge Audit] HIGH IMPACT DETECTED');
      console.warn('Recommendations:');
      recommendations.forEach((r) => console.warn(`  - ${r}`));
    } else if (riskFactors.length > 2) {
      status = 'warning';
    } else {
      status = 'success';
    }

    const result: MergeAuditResult = {
      status,
      category: impact.category,
      details: {
        jobImpact: impact.score,
        automationScore,
        riskFactors,
        recommendations,
      },
      auditId,
      timestamp,
    };

    // Log result
    console.log('\n[Merge Audit] Audit Complete');
    console.log(`  Status: ${status}`);
    console.log(`  Impact Category: ${impact.category}`);
    console.log(`  Job Impact Score: ${impact.score}/100`);
    console.log(`  Automation Score: ${automationScore}/100`);

    if (riskFactors.length > 0) {
      console.log('  Risk Factors:');
      riskFactors.forEach((r) => console.log(`    - ${r}`));
    }

    return result;
  } catch (error) {
    console.error('[Merge Audit] Error:', error);
    return {
      status: 'failed',
      category: 'high',
      details: {
        jobImpact: 0,
        automationScore: 0,
        riskFactors: ['Audit failed - manual review required'],
        recommendations: ['Review merge changes manually'],
      },
      timestamp,
    };
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

/**
 * CLI entry point for running merge audit
 *
 * Usage: npx tsx apps/web/src/lib/ethics/merge-audit.ts [options]
 */
async function main() {
  console.log('\n========================================');
  console.log('Merge Ethics Audit');
  console.log('========================================\n');

  // Parse CLI arguments
  const args = process.argv.slice(2);
  const context: MergeContext = {
    automationLevel: 'partial',
    teamSize: 10,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--files':
        context.filesChanged = parseInt(args[++i], 10);
        break;
      case '--conflicts':
        context.conflictsResolved = parseInt(args[++i], 10);
        break;
      case '--strategy':
        context.strategy = args[++i] as 'theirs' | 'ours' | 'manual';
        break;
      case '--team-size':
        context.teamSize = parseInt(args[++i], 10);
        break;
      case '--automation':
        context.automationLevel = args[++i] as 'full' | 'partial' | 'manual';
        break;
    }
  }

  const result = await auditMergeChanges(context);

  // Exit with appropriate code
  if (result.status === 'failed') {
    process.exit(1);
  } else if (result.status === 'warning' && result.category === 'high') {
    process.exit(2); // Warn but don't fail
  } else {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export { MergeContext, MergeAuditResult };
