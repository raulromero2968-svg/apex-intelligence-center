/**
 * Cross-Pack XR API Routes
 *
 * Unified XR session management endpoints.
 * Implements cross-pack integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  detectDeviceCapabilities,
  selectPlatform,
  startXrSession,
  endXrSession,
  getActiveSession,
  switchRenderMode,
  getQuiltConfig,
  shouldFallbackToLightField,
  type XrSessionConfig,
  type RenderMode,
  DEFAULT_XR_CONFIG,
  PLATFORM_CAPABILITIES,
} from '@/lib/cross-pack';

/**
 * POST /api/cross-pack/xr
 * XR session operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start-session': {
        const { config } = body as { config?: Partial<XrSessionConfig> };

        const session = await startXrSession({
          ...DEFAULT_XR_CONFIG,
          ...config,
        });

        return NextResponse.json({
          success: true,
          session,
        });
      }

      case 'end-session': {
        await endXrSession();

        return NextResponse.json({
          success: true,
          message: 'Session ended',
        });
      }

      case 'switch-mode': {
        const { targetMode, duration, easing } = body as {
          targetMode: RenderMode;
          duration?: number;
          easing?: 'linear' | 'ease-in-out' | 'ease-in' | 'ease-out';
        };

        if (!targetMode) {
          return NextResponse.json(
            { error: 'targetMode required' },
            { status: 400 }
          );
        }

        await switchRenderMode(targetMode, { duration, easing });

        const session = getActiveSession();
        return NextResponse.json({
          success: true,
          session,
        });
      }

      case 'select-platform': {
        const { config } = body as { config?: Partial<XrSessionConfig> };

        const selection = await selectPlatform({
          ...DEFAULT_XR_CONFIG,
          ...config,
        });

        return NextResponse.json({
          success: true,
          selection,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start-session, end-session, switch-mode, or select-platform' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing XR request:', error);
    return NextResponse.json(
      { error: 'Failed to process XR request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cross-pack/xr
 * Get XR information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'capabilities': {
        const capabilities = await detectDeviceCapabilities();

        return NextResponse.json({
          success: true,
          capabilities,
          shouldFallbackToLightField: shouldFallbackToLightField(capabilities),
        });
      }

      case 'session': {
        const session = getActiveSession();

        return NextResponse.json({
          success: true,
          session,
          hasActiveSession: session !== null,
        });
      }

      case 'platforms': {
        return NextResponse.json({
          success: true,
          platforms: Object.entries(PLATFORM_CAPABILITIES).map(([platform, caps]) => ({
            platform,
            ...caps,
          })),
        });
      }

      case 'quilt-config': {
        const displayType = searchParams.get('displayType') as 'portrait' | 'landscape' | '8k' || 'portrait';
        const config = getQuiltConfig(displayType);

        return NextResponse.json({
          success: true,
          displayType,
          config,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: capabilities, session, platforms, or quilt-config' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching XR info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch XR info' },
      { status: 500 }
    );
  }
}
