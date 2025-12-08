/**
 * VARC Scan API - Vision-Based Abstract Reasoning for TCG Card Analysis
 *
 * This API endpoint enables "Vision-In, Data-Out" capability for the Apex Intelligence platform.
 * Uses OpenAI's GPT-4o Vision to identify and grade TCG cards from uploaded images.
 *
 * Features:
 * - Image upload via FormData (JPEG, PNG, WebP - max 4MB)
 * - Type-safe structured JSON response matching database schema
 * - Confidence scoring to detect AI hallucinations (< 0.7 flags for review)
 * - Rate limiting per subscription tier
 * - Sentry error tracking
 *
 * @see AI Research & Strategy [VARC Pillar]
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import * as Sentry from '@sentry/nextjs';
import { getUserFromRequest } from '@/lib/auth';
import { getRetryAfter, multiModalRateLimiters } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

// Confidence threshold - below this, flag for user review
const CONFIDENCE_THRESHOLD = 0.7;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Card condition grades following industry standard (PSA-like scale simplified)
 */
type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

/**
 * Structured response from the AI vision model
 * This schema ensures type-safe data that matches our database
 */
interface VarcScanResult {
  /** The name of the card (e.g., "Charizard") */
  cardName: string;
  /** The set the card belongs to (e.g., "Base Set") */
  set: string;
  /** Card number within the set (e.g., "4/102") */
  number: string;
  /** Card language (e.g., "English", "Japanese") */
  language: string;
  /** Physical condition assessment */
  condition: CardCondition;
  /** AI confidence score (0-1) - below 0.7 flags for manual review */
  confidence: number;
  /** Optional notable features of the card */
  features?: string[];
}

/**
 * API Response envelope
 */
interface ScanApiResponse {
  success: boolean;
  data?: VarcScanResult;
  needsReview?: boolean;
  reviewReason?: string;
  error?: string;
  errorCode?: string;
}

// ============================================================================
// OPENAI SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert TCG (Trading Card Game) Grader and Identifier with decades of experience analyzing Pokemon, Magic: The Gathering, Yu-Gi-Oh, and other collectible card games.

Your task is to analyze the provided card image and return ONLY valid JSON with no additional text or markdown formatting.

Analyze the card for:
1. Card identification (name, set, number)
2. Language (English, Japanese, etc.)
3. Physical condition assessment
4. Notable features (holographic, 1st edition, shadowless, etc.)

CONDITION GRADING GUIDE:
- "NM" (Near Mint): Virtually perfect. Minor imperfections only visible under close inspection.
- "LP" (Lightly Played): Slight wear on edges/corners. Light scratches or minor whitening.
- "MP" (Moderately Played): Obvious wear. Noticeable scratches, edge wear, or surface wear.
- "HP" (Heavily Played): Significant wear. Heavy scratches, creasing, or damage visible at arm's length.
- "DMG" (Damaged): Major damage. Tears, water damage, missing pieces, or severe bending.

CONFIDENCE SCORING:
- 0.95-1.00: Crystal clear image, certain identification
- 0.80-0.94: Good image, high confidence
- 0.70-0.79: Some uncertainty, recommend verification
- Below 0.70: Low confidence, flag for manual review

Return JSON in this EXACT format:
{
  "cardName": "string",
  "set": "string",
  "number": "string (e.g., '4/102')",
  "language": "string",
  "condition": "NM" | "LP" | "MP" | "HP" | "DMG",
  "confidence": number (0-1),
  "features": ["array", "of", "strings"] (optional)
}

If the image is blurry, not a TCG card, or unidentifiable, return:
{
  "cardName": "UNIDENTIFIED",
  "set": "UNKNOWN",
  "number": "UNKNOWN",
  "language": "UNKNOWN",
  "condition": "UNKNOWN",
  "confidence": 0.0,
  "features": [],
  "error": "Brief description of why the card cannot be identified"
}`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates the uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file exists
  if (!file || file.size === 0) {
    return { valid: false, error: 'No file provided or file is empty' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File too large: ${sizeMB}MB. Maximum allowed: 4MB`
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP`
    };
  }

  return { valid: true };
}

/**
 * Converts a File to Base64 data URL for OpenAI Vision API
 */
async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${file.type};base64,${base64}`;
}

/**
 * Validates and parses the AI response to ensure type safety
 */
function parseAiResponse(content: string): VarcScanResult {
  let parsed: Record<string, unknown>;

  try {
    // Handle potential markdown code blocks
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    parsed = JSON.parse(cleanContent);
  } catch (e) {
    throw new Error('AI returned invalid JSON');
  }

  // Validate required fields
  const requiredFields = ['cardName', 'set', 'number', 'language', 'condition', 'confidence'];
  for (const field of requiredFields) {
    if (!(field in parsed)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate condition enum
  const validConditions: CardCondition[] = ['NM', 'LP', 'MP', 'HP', 'DMG'];
  const condition = String(parsed.condition).toUpperCase();
  if (!validConditions.includes(condition as CardCondition) && condition !== 'UNKNOWN') {
    // Default to MP if unclear
    parsed.condition = 'MP';
  }

  // Validate confidence is a number between 0 and 1
  const confidence = Number(parsed.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    parsed.confidence = 0.5; // Default to medium confidence
  }

  // Validate features array if present
  if (parsed.features && !Array.isArray(parsed.features)) {
    parsed.features = [];
  }

  return {
    cardName: String(parsed.cardName),
    set: String(parsed.set),
    number: String(parsed.number),
    language: String(parsed.language),
    condition: parsed.condition as CardCondition,
    confidence: Number(parsed.confidence),
    features: parsed.features as string[] | undefined,
  };
}

/**
 * Creates standard response headers with security settings
 */
function createResponseHeaders(rateLimitInfo?: { limit: number; remaining: number; reset: number }): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'",
  };

  if (rateLimitInfo) {
    Object.assign(headers, {
      'X-RateLimit-Limit': String(rateLimitInfo.limit),
      'X-RateLimit-Remaining': String(rateLimitInfo.remaining),
      'X-RateLimit-Reset': String(rateLimitInfo.reset),
    });
  }

  return headers;
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * POST /api/scan
 *
 * Analyzes a TCG card image using GPT-4o Vision and returns structured identification data.
 *
 * @param request - NextRequest containing FormData with 'file' field
 * @returns Structured JSON with card identification and grading
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // =========================================================================
    // 1. AUTHENTICATION (Optional for v1, required for production)
    // =========================================================================
    const user = await getUserFromRequest(request);
    const userId = user?.id || 'anonymous';
    const tier = user?.subscriptionTier || 'free';

    // =========================================================================
    // 2. RATE LIMITING
    // =========================================================================
    const rateLimitResult = await multiModalRateLimiters.imageProcess.limitWithTier(
      userId,
      tier
    );

    if (!rateLimitResult.success) {
      const retryAfter = getRetryAfter(rateLimitResult.reset);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          errorCode: 'RATE_LIMIT_EXCEEDED',
        } as ScanApiResponse),
        {
          status: 429,
          headers: {
            ...createResponseHeaders(rateLimitResult),
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // =========================================================================
    // 3. INPUT PARSING & VALIDATION
    // =========================================================================
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request format. Expected multipart/form-data.',
          errorCode: 'INVALID_FORMAT',
        } as ScanApiResponse),
        { status: 400, headers: createResponseHeaders() }
      );
    }

    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No file provided. Please upload an image.',
          errorCode: 'NO_FILE',
        } as ScanApiResponse),
        { status: 400, headers: createResponseHeaders() }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error,
          errorCode: 'INVALID_FILE',
        } as ScanApiResponse),
        { status: 400, headers: createResponseHeaders() }
      );
    }

    // =========================================================================
    // 4. CONVERT TO BASE64
    // =========================================================================
    const base64Image = await fileToBase64(file);

    // =========================================================================
    // 5. OPENAI VISION API CALL
    // =========================================================================
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      Sentry.captureMessage('OPENAI_API_KEY not configured', 'error');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Vision service not configured',
          errorCode: 'SERVICE_UNAVAILABLE',
        } as ScanApiResponse),
        { status: 503, headers: createResponseHeaders() }
      );
    }

    const openai = new OpenAI({ apiKey });

    let aiResponse: OpenAI.Chat.Completions.ChatCompletion;
    try {
      aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                  detail: 'high', // Use high detail for better card analysis
                },
              },
              {
                type: 'text',
                text: 'Analyze this TCG card image and return the identification and grading data as JSON.',
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.1, // Low temperature for consistent, factual responses
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'scan', stage: 'openai_call' },
        extra: { userId, fileType: file.type, fileSize: file.size },
      });

      // Check for specific OpenAI errors
      if (error instanceof OpenAI.APIError) {
        if (error.status === 400) {
          // Image might be unprocessable
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Unable to process image. Please try with a clearer photo.',
              errorCode: 'IMAGE_UNPROCESSABLE',
            } as ScanApiResponse),
            { status: 422, headers: createResponseHeaders() }
          );
        }
        if (error.status === 429) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Service temporarily busy. Please try again in a moment.',
              errorCode: 'SERVICE_BUSY',
            } as ScanApiResponse),
            { status: 503, headers: createResponseHeaders() }
          );
        }
      }

      throw error; // Re-throw for generic error handling
    }

    // =========================================================================
    // 6. PARSE & VALIDATE AI RESPONSE
    // =========================================================================
    const content = aiResponse.choices[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No response from vision service',
          errorCode: 'EMPTY_RESPONSE',
        } as ScanApiResponse),
        { status: 500, headers: createResponseHeaders() }
      );
    }

    let scanResult: VarcScanResult;
    try {
      scanResult = parseAiResponse(content);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'scan', stage: 'parse_response' },
        extra: { rawContent: content },
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse vision response',
          errorCode: 'PARSE_ERROR',
        } as ScanApiResponse),
        { status: 500, headers: createResponseHeaders() }
      );
    }

    // =========================================================================
    // 7. CONFIDENCE CHECK (Hallucination Safeguard)
    // =========================================================================
    const needsReview = scanResult.confidence < CONFIDENCE_THRESHOLD;
    const isUnidentified = scanResult.cardName === 'UNIDENTIFIED';

    if (isUnidentified) {
      // Card couldn't be identified - return specific error
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not identify card. Please upload a clearer image showing the full card.',
          errorCode: 'CARD_NOT_IDENTIFIED',
          needsReview: true,
          reviewReason: 'Image quality or content not suitable for identification',
        } as ScanApiResponse),
        { status: 422, headers: createResponseHeaders() }
      );
    }

    // =========================================================================
    // 8. SUCCESS RESPONSE
    // =========================================================================
    const processingTime = Date.now() - startTime;

    const response: ScanApiResponse = {
      success: true,
      data: scanResult,
      needsReview,
      reviewReason: needsReview
        ? `Confidence score (${(scanResult.confidence * 100).toFixed(0)}%) below threshold. Please verify the identification.`
        : undefined,
    };

    // Log successful scan for analytics
    console.log(`[scan] Success: ${scanResult.cardName} (${scanResult.set}) - ${scanResult.confidence.toFixed(2)} confidence - ${processingTime}ms`);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: createResponseHeaders(rateLimitResult),
      }
    );

  } catch (error) {
    // =========================================================================
    // GLOBAL ERROR HANDLER
    // =========================================================================
    Sentry.captureException(error, {
      tags: { endpoint: 'scan' },
    });
    console.error('[scan] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        errorCode: 'INTERNAL_ERROR',
      } as ScanApiResponse),
      { status: 500, headers: createResponseHeaders() }
    );
  }
}

/**
 * GET /api/scan
 *
 * Returns API documentation and status
 */
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({
      name: 'VARC Scan API',
      version: '1.0.0',
      description: 'Vision-Based Abstract Reasoning for TCG Card Analysis',
      endpoints: {
        'POST /api/scan': {
          description: 'Analyze a TCG card image',
          contentType: 'multipart/form-data',
          body: {
            file: 'Image file (JPEG, PNG, or WebP, max 4MB)',
          },
          response: {
            success: 'boolean',
            data: {
              cardName: 'string',
              set: 'string',
              number: 'string',
              language: 'string',
              condition: 'NM | LP | MP | HP | DMG',
              confidence: 'number (0-1)',
              features: 'string[] (optional)',
            },
            needsReview: 'boolean (true if confidence < 0.7)',
            reviewReason: 'string (optional)',
          },
          errorCodes: [
            'NO_FILE - No file provided',
            'INVALID_FILE - Invalid file type or size',
            'RATE_LIMIT_EXCEEDED - Too many requests',
            'IMAGE_UNPROCESSABLE - Image cannot be processed',
            'CARD_NOT_IDENTIFIED - Card not recognizable',
            'SERVICE_UNAVAILABLE - Vision service not configured',
          ],
        },
      },
      rateLimits: {
        free: '20 requests/minute',
        pro: '100 requests/minute',
        enterprise: 'Unlimited',
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
