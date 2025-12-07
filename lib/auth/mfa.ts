/**
 * Multi-Factor Authentication (MFA) Module
 *
 * Implements TOTP (Time-based One-Time Password) and SMS-based 2FA
 * as recommended by the Security Audit Report (Section 1)
 *
 * @module lib/auth/mfa
 * @see Security Audit Report - Authentication Hardening
 */

import { randomBytes, createHmac } from 'crypto';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface MFASecret {
  base32: string;
  otpauthUrl: string;
  qrCodeDataUrl?: string;
}

export interface MFAVerificationResult {
  valid: boolean;
  remainingAttempts?: number;
  lockedUntil?: Date;
}

export interface SMSCodeResult {
  success: boolean;
  expiresAt: Date;
  codeHash: string; // Store hash, not raw code
}

export interface MFAConfig {
  issuer: string;
  algorithm: 'sha1' | 'sha256' | 'sha512';
  digits: number;
  period: number;
  window: number; // Time window tolerance
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: MFAConfig = {
  issuer: 'Apex Intelligence',
  algorithm: 'sha1',
  digits: 6,
  period: 30,
  window: 1, // Accept codes from 1 period before/after
};

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const SMS_CODE_EXPIRY_MINUTES = 5;
const MAX_VERIFICATION_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

// =============================================================================
// TOTP IMPLEMENTATION
// =============================================================================

/**
 * Encode bytes to Base32
 */
function base32Encode(buffer: Buffer): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      bits -= 5;
      result += BASE32_ALPHABET[(value >> bits) & 0x1f];
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

/**
 * Decode Base32 to bytes
 */
function base32Decode(encoded: string): Buffer {
  const cleanedInput = encoded.replace(/=+$/, '').toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleanedInput) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate HMAC-based OTP
 */
function generateHOTP(
  secret: Buffer,
  counter: bigint,
  digits: number = 6,
  algorithm: string = 'sha1'
): string {
  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(counter);

  // Generate HMAC
  const hmac = createHmac(algorithm, secret);
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  // Generate digits
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

/**
 * Generate TOTP for current time
 */
function generateTOTP(
  secret: string,
  config: Partial<MFAConfig> = {}
): string {
  const { algorithm, digits, period } = { ...DEFAULT_CONFIG, ...config };
  const secretBuffer = base32Decode(secret);
  const counter = BigInt(Math.floor(Date.now() / 1000 / period));
  return generateHOTP(secretBuffer, counter, digits, algorithm);
}

/**
 * Verify TOTP with time window tolerance
 */
function verifyTOTP(
  secret: string,
  token: string,
  config: Partial<MFAConfig> = {}
): boolean {
  const { algorithm, digits, period, window } = { ...DEFAULT_CONFIG, ...config };
  const secretBuffer = base32Decode(secret);
  const currentCounter = BigInt(Math.floor(Date.now() / 1000 / period));

  // Check tokens within the time window
  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + BigInt(i);
    const expectedToken = generateHOTP(secretBuffer, counter, digits, algorithm);
    if (expectedToken === token) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Generate a new MFA secret for a user
 *
 * @param userId - User identifier for tracking
 * @param email - User email for otpauth URL
 * @param config - Optional MFA configuration
 * @returns MFA secret with base32 encoding and otpauth URL
 */
export function generateTOTPSecret(
  userId: string,
  email: string,
  config: Partial<MFAConfig> = {}
): MFASecret {
  const { issuer, algorithm, digits, period } = { ...DEFAULT_CONFIG, ...config };

  // Generate 20 bytes (160 bits) of random secret - NIST recommendation
  const secretBytes = randomBytes(20);
  const base32Secret = base32Encode(secretBytes);

  // Build otpauth URL for QR code generation
  const otpauthUrl = new URL('otpauth://totp/');
  otpauthUrl.pathname = `//${encodeURIComponent(issuer)}:${encodeURIComponent(email)}`;
  otpauthUrl.searchParams.set('secret', base32Secret);
  otpauthUrl.searchParams.set('issuer', issuer);
  otpauthUrl.searchParams.set('algorithm', algorithm.toUpperCase());
  otpauthUrl.searchParams.set('digits', digits.toString());
  otpauthUrl.searchParams.set('period', period.toString());

  return {
    base32: base32Secret,
    otpauthUrl: otpauthUrl.toString().replace('//', ''),
  };
}

/**
 * Verify a TOTP token against a stored secret
 *
 * @param secret - Base32 encoded secret
 * @param token - 6-digit token from authenticator app
 * @param config - Optional MFA configuration
 * @returns Verification result with remaining attempts
 */
export function verifyTOTPToken(
  secret: string,
  token: string,
  config: Partial<MFAConfig> = {}
): MFAVerificationResult {
  // Validate token format
  if (!/^\d{6}$/.test(token)) {
    return { valid: false };
  }

  const valid = verifyTOTP(secret, token, config);
  return { valid };
}

/**
 * Generate a 6-digit SMS verification code
 *
 * @returns SMS code details with hash for storage
 */
export function generateSMSCode(): { code: string; hash: string; expiresAt: Date } {
  // Generate cryptographically secure 6-digit code
  const code = (randomBytes(4).readUInt32BE() % 900000 + 100000).toString();

  // Create hash for secure storage
  const hash = createHmac('sha256', process.env.SMS_CODE_SECRET || 'apex-sms-secret')
    .update(code)
    .digest('hex');

  const expiresAt = new Date(Date.now() + SMS_CODE_EXPIRY_MINUTES * 60 * 1000);

  return { code, hash, expiresAt };
}

/**
 * Verify an SMS code against stored hash
 *
 * @param inputCode - Code entered by user
 * @param storedHash - Hash stored in session/Redis
 * @param expiresAt - Expiration timestamp
 * @returns Whether the code is valid
 */
export function verifySMSCode(
  inputCode: string,
  storedHash: string,
  expiresAt: Date
): boolean {
  // Check expiration
  if (new Date() > expiresAt) {
    return false;
  }

  // Verify hash
  const inputHash = createHmac('sha256', process.env.SMS_CODE_SECRET || 'apex-sms-secret')
    .update(inputCode)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (inputHash.length !== storedHash.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < inputHash.length; i++) {
    result |= inputHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Send SMS verification code via Twilio
 *
 * @param phone - Phone number in E.164 format
 * @param code - 6-digit verification code
 * @returns Success status
 */
export async function sendSMSCode(phone: string, code: string): Promise<boolean> {
  // Validate Twilio credentials
  const twilioSid = process.env.TWILIO_SID;
  const twilioToken = process.env.TWILIO_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE;

  if (!twilioSid || !twilioToken || !twilioPhone) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
    // Use Twilio REST API directly to avoid dependency issues
    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioPhone,
          Body: `Your Apex Intelligence verification code: ${code}. Valid for ${SMS_CODE_EXPIRY_MINUTES} minutes. Do not share this code.`,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio SMS error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
}

/**
 * Check if user is locked out from MFA attempts
 *
 * @param failedAttempts - Number of failed attempts
 * @param lastFailedAt - Timestamp of last failure
 * @returns Lockout status
 */
export function checkMFALockout(
  failedAttempts: number,
  lastFailedAt: Date | null
): { locked: boolean; remainingAttempts: number; lockedUntil?: Date } {
  if (failedAttempts < MAX_VERIFICATION_ATTEMPTS) {
    return {
      locked: false,
      remainingAttempts: MAX_VERIFICATION_ATTEMPTS - failedAttempts,
    };
  }

  if (!lastFailedAt) {
    return { locked: false, remainingAttempts: MAX_VERIFICATION_ATTEMPTS };
  }

  const lockoutEnd = new Date(lastFailedAt.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);

  if (new Date() > lockoutEnd) {
    // Lockout expired
    return { locked: false, remainingAttempts: MAX_VERIFICATION_ATTEMPTS };
  }

  return {
    locked: true,
    remainingAttempts: 0,
    lockedUntil: lockoutEnd,
  };
}

/**
 * Generate backup codes for account recovery
 *
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of 8-character backup codes and their hashes
 */
export function generateBackupCodes(count: number = 10): Array<{ code: string; hash: string }> {
  const codes: Array<{ code: string; hash: string }> = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .slice(0, 8);

    // Hash for secure storage
    const hash = createHmac('sha256', process.env.BACKUP_CODE_SECRET || 'apex-backup-secret')
      .update(code)
      .digest('hex');

    codes.push({ code, hash });
  }

  return codes;
}

/**
 * Verify a backup code
 *
 * @param inputCode - Code entered by user
 * @param storedHashes - Array of stored backup code hashes
 * @returns Index of used code (-1 if invalid)
 */
export function verifyBackupCode(
  inputCode: string,
  storedHashes: string[]
): number {
  const inputHash = createHmac('sha256', process.env.BACKUP_CODE_SECRET || 'apex-backup-secret')
    .update(inputCode.toUpperCase().replace(/[^A-Z0-9]/g, ''))
    .digest('hex');

  for (let i = 0; i < storedHashes.length; i++) {
    // Constant-time comparison
    let match = true;
    for (let j = 0; j < inputHash.length; j++) {
      if (inputHash[j] !== storedHashes[i][j]) {
        match = false;
      }
    }
    if (match && inputHash.length === storedHashes[i].length) {
      return i;
    }
  }

  return -1;
}

// =============================================================================
// HARDWARE KEY SUPPORT (WebAuthn Preparation)
// =============================================================================

export interface WebAuthnChallenge {
  challenge: string;
  timeout: number;
  rpId: string;
  rpName: string;
}

/**
 * Generate WebAuthn challenge for hardware key registration/verification
 * Note: Full WebAuthn implementation requires client-side handling
 *
 * @param rpId - Relying Party ID (typically domain)
 * @returns WebAuthn challenge parameters
 */
export function generateWebAuthnChallenge(rpId: string = 'apex-intelligence.io'): WebAuthnChallenge {
  return {
    challenge: randomBytes(32).toString('base64url'),
    timeout: 60000, // 60 seconds
    rpId,
    rpName: 'Apex Intelligence',
  };
}

export const MFA_CONSTANTS = {
  MAX_VERIFICATION_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  SMS_CODE_EXPIRY_MINUTES,
  DEFAULT_CONFIG,
};
