/**
 * User Registration API with Minor Protection
 *
 * Creates new user accounts with automatic age verification and minor flagging.
 * Minors (under 18) are permanently restricted to free tier and cannot access:
 * - Payment processing
 * - Wallet connections (if implemented)
 * - Token-gated features
 * - Subscription upgrades
 *
 * COPPA Compliance: All users must provide birthDate for age verification.
 */

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { signJwt } from '@/lib/auth';
import {
  ValidationError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import {
  isMinor,
  isValidBirthDate,
  getTimeUntilAdult,
} from '@/lib/auth/age-verification';

/**
 * Registration schema with required birthDate for age verification
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
  birthDate: z.string().datetime('Birth date must be a valid ISO 8601 datetime'),
});

/**
 * POST /api/auth/register
 *
 * Register a new user with automatic minor protection
 */
export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      throw new ValidationError(validation.error.errors[0].message);
    }

    const { email, password, name, birthDate: birthDateStr } = validation.data;

    // Parse and validate birth date
    const birthDate = new Date(birthDateStr);
    if (!isValidBirthDate(birthDate)) {
      throw new ValidationError(
        'Invalid birth date. Birth date must be in the past and within reasonable limits.'
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return Response.json(
        {
          error: 'Conflict',
          message: 'An account with this email already exists',
          code: 'EMAIL_EXISTS',
        },
        { status: 409 }
      );
    }

    // Determine minor status
    const userIsMinor = isMinor(birthDate);

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = randomUUID();

    // Create user in database
    // SECURITY: Minors are automatically restricted to free tier by database constraint
    await db.insert(users).values({
      id: userId,
      email,
      name: name || null,
      birthDate,
      isMinor: userIsMinor,
      subscriptionTier: 'free',
      subscriptionStatus: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionEndsAt: null,
      parentalConsentGiven: false,
      parentalConsentDate: null,
      parentalGuardianEmail: null,
      // Note: Password is not stored in schema - would need to add if implementing password auth
      // For now, this is a placeholder implementation
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = signJwt(
      {
        sub: userId,
        email,
        tier: 'free',
        isMinor: userIsMinor,
      },
      jwtSecret
    );

    // Prepare response with appropriate messaging for minors
    const response: any = {
      success: true,
      user: {
        id: userId,
        email,
        name: name || null,
        tier: 'free',
        isMinor: userIsMinor,
      },
      token,
    };

    // Add minor-specific messaging
    if (userIsMinor) {
      const timeUntil = getTimeUntilAdult(birthDate);
      response.minorNotice = {
        message: 'Account created successfully! Your account has special protections because you are under 18.',
        restrictions: [
          'Free tier access (permanent)',
          'Payment features disabled',
          'Wallet connections disabled',
          'Token-gated features disabled',
        ],
        adultDate: timeUntil
          ? `Full access available in ${timeUntil}`
          : 'Full access available when you turn 18',
      };
    }

    return Response.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
