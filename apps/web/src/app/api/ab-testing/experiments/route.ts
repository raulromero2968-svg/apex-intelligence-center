/**
 * A/B Testing Experiments API Routes
 *
 * Endpoints for experiment management.
 * Implements knowledge-06-data-ab-testing.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  assignUserToExperiment,
  getActiveAssignments,
  getMergedFeatureFlags,
  validateExperiment,
  type Experiment,
  type AssignmentContext,
} from '@/lib/ab-testing';

// Mock experiments store (in production, use database)
const experiments = new Map<string, Experiment>();

/**
 * POST /api/ab-testing/experiments
 * Create new experiment or assign user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const { experiment } = body;

        // Validate experiment
        const errors = validateExperiment(experiment);
        if (errors.length > 0) {
          return NextResponse.json(
            { error: 'Validation failed', errors },
            { status: 400 }
          );
        }

        const id = `exp-${Date.now()}`;
        const newExperiment: Experiment = {
          ...experiment,
          id,
          status: experiment.status || 'draft',
        };

        experiments.set(id, newExperiment);

        return NextResponse.json({
          success: true,
          experiment: newExperiment,
        });
      }

      case 'assign': {
        const { experimentId, context } = body as {
          experimentId: string;
          context: AssignmentContext;
        };

        const experiment = experiments.get(experimentId);
        if (!experiment) {
          return NextResponse.json(
            { error: 'Experiment not found' },
            { status: 404 }
          );
        }

        const assignment = assignUserToExperiment(experiment, context);

        return NextResponse.json({
          success: true,
          assignment,
        });
      }

      case 'assign-all': {
        const { projectId, context } = body as {
          projectId: string;
          context: AssignmentContext;
        };

        // Get all running experiments for project
        const projectExperiments = Array.from(experiments.values()).filter(
          (e) => e.status === 'running'
        );

        const assignments = getActiveAssignments(projectExperiments, context);
        const featureFlags = getMergedFeatureFlags(assignments);

        return NextResponse.json({
          success: true,
          assignments: Object.fromEntries(assignments),
          featureFlags,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, assign, or assign-all' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing experiment request:', error);
    return NextResponse.json(
      { error: 'Failed to process experiment request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ab-testing/experiments
 * Get experiments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('id');
    const status = searchParams.get('status');
    const targetModule = searchParams.get('targetModule');

    // Get single experiment
    if (experimentId) {
      const experiment = experiments.get(experimentId);
      if (!experiment) {
        return NextResponse.json(
          { error: 'Experiment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        experiment,
      });
    }

    // Filter experiments
    let results = Array.from(experiments.values());

    if (status) {
      results = results.filter((e) => e.status === status);
    }

    if (targetModule) {
      results = results.filter((e) => e.targetModule === targetModule);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      experiments: results,
    });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ab-testing/experiments
 * Update experiment
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Experiment ID required' },
        { status: 400 }
      );
    }

    const experiment = experiments.get(id);
    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    const updated = { ...experiment, ...updates };
    experiments.set(id, updated);

    return NextResponse.json({
      success: true,
      experiment: updated,
    });
  } catch (error) {
    console.error('Error updating experiment:', error);
    return NextResponse.json(
      { error: 'Failed to update experiment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ab-testing/experiments
 * Delete experiment
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Experiment ID required' },
        { status: 400 }
      );
    }

    const deleted = experiments.delete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: id,
    });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    return NextResponse.json(
      { error: 'Failed to delete experiment' },
      { status: 500 }
    );
  }
}
