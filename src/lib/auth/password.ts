/**
 * Password Policy & Validation Module
 *
 * Strong password policies with HIBP (Have I Been Pwned) breach detection.
 * Implements NIST SP 800-63B guidelines and OWASP recommendations.
 *
 * Trade-offs:
 * - GOOD: HIBP prevents reused passwords from known breaches
 * - BAD: Complex rules frustrate users; enforce min length + breach check instead
 * - GOOD: Breach checks enhance security
 * - BAD: HIBP API calls add latency (100ms); cache results for performance
 *
 * @see NIST SP 800-63B Digital Identity Guidelines
 * @see OWASP Password Storage Cheatsheet
 */

import { createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  breachCount?: number;
}

export interface PasswordConfig {
  /** Minimum password length (NIST recommends 8, we use 12) */
  minLength: number;
  /** Maximum password length (NIST recommends 64+) */
  maxLength: number;
  /** Require at least one uppercase letter */
  requireUppercase: boolean;
  /** Require at least one lowercase letter */
  requireLowercase: boolean;
  /** Require at least one digit */
  requireDigit: boolean;
  /** Require at least one special character */
  requireSpecial: boolean;
  /** Check against HIBP database */
  checkBreached: boolean;
  /** Maximum allowed breach count (0 = reject any breached password) */
  maxBreachCount: number;
  /** Bcrypt cost factor (12-14 recommended for production) */
  bcryptRounds: number;
  /** Cache breach check results (seconds) */
  breachCacheTtl: number;
}

// Default configuration following NIST guidelines with enhanced security
const DEFAULT_PASSWORD_CONFIG: PasswordConfig = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
  checkBreached: true,
  maxBreachCount: 0,
  bcryptRounds: 12,
  breachCacheTtl: 3600, // 1 hour
};

// Common passwords to reject (top 100 most common)
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  '1234567890', 'qwerty', 'qwerty123', 'abc123', 'monkey', 'master', 'dragon',
  'letmein', 'login', 'admin', 'welcome', 'welcome1', 'p@ssw0rd', 'passw0rd',
  'iloveyou', 'princess', 'sunshine', 'shadow', 'football', 'baseball',
  'trustno1', 'whatever', 'access', 'superman', 'batman', 'starwars',
]);

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Validate password against policy
 *
 * Trade-off: We check complexity but prioritize length and breach status
 */
export function validatePasswordPolicy(
  password: string,
  config: Partial<PasswordConfig> = {}
): Omit<PasswordValidationResult, 'breachCount'> {
  const mergedConfig = { ...DEFAULT_PASSWORD_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];

  // Length checks
  if (password.length < mergedConfig.minLength) {
    errors.push(`Password must be at least ${mergedConfig.minLength} characters`);
  }

  if (password.length > mergedConfig.maxLength) {
    errors.push(`Password must be no more than ${mergedConfig.maxLength} characters`);
  }

  // Character class checks
  if (mergedConfig.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (mergedConfig.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (mergedConfig.requireDigit && !/\d/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  if (mergedConfig.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common and easily guessable');
  }

  // Check for sequential characters (e.g., "abc", "123")
  if (hasSequentialChars(password, 4)) {
    warnings.push('Avoid sequential characters like "abcd" or "1234"');
  }

  // Check for repeated characters (e.g., "aaa", "111")
  if (hasRepeatedChars(password, 3)) {
    warnings.push('Avoid repeated characters like "aaa" or "111"');
  }

  // Calculate strength
  const strength = calculatePasswordStrength(password, errors.length);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    strength,
  };
}

/**
 * Full password validation including HIBP breach check
 */
export async function validatePassword(
  password: string,
  config: Partial<PasswordConfig> = {}
): Promise<PasswordValidationResult> {
  const mergedConfig = { ...DEFAULT_PASSWORD_CONFIG, ...config };

  // First, validate against policy
  const policyResult = validatePasswordPolicy(password, config);

  // If policy validation failed, return early
  if (!policyResult.valid) {
    return { ...policyResult, breachCount: undefined };
  }

  // Check HIBP if enabled
  if (mergedConfig.checkBreached) {
    try {
      const breachCount = await checkPasswordBreached(password);

      if (breachCount > mergedConfig.maxBreachCount) {
        return {
          ...policyResult,
          valid: false,
          errors: [...policyResult.errors, `This password has been exposed in ${breachCount} data breaches`],
          breachCount,
        };
      }

      if (breachCount > 0) {
        policyResult.warnings.push(
          `This password has appeared in ${breachCount} data breaches but is below threshold`
        );
      }

      return { ...policyResult, breachCount };
    } catch (error) {
      console.warn('[Password] HIBP check failed, skipping breach validation:', error);
      // Don't block on HIBP API failure
      policyResult.warnings.push('Could not verify password against breach databases');
      return { ...policyResult, breachCount: undefined };
    }
  }

  return { ...policyResult, breachCount: undefined };
}

// ============================================================================
// HIBP (HAVE I BEEN PWNED) INTEGRATION
// ============================================================================

/**
 * Check if password appears in HIBP database
 *
 * Uses k-Anonymity model: Only sends first 5 chars of SHA-1 hash
 *
 * Trade-off: API call adds ~100ms latency; consider caching results
 */
export async function checkPasswordBreached(password: string): Promise<number> {
  // SHA-1 hash of password
  const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'Apex-Intelligence-PasswordChecker/1.0',
        'Add-Padding': 'true', // Padding to prevent traffic analysis
      },
    });

    if (!response.ok) {
      throw new Error(`HIBP API returned ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix?.trim() === suffix) {
        return parseInt(count?.trim() || '0', 10);
      }
    }

    return 0; // Not found in breach database
  } catch (error) {
    console.error('[HIBP] Password check failed:', error);
    throw error;
  }
}

/**
 * Cached HIBP check (in-memory, for demonstration)
 * In production, use Redis cache
 */
const breachCache = new Map<string, { count: number; timestamp: number }>();

export async function checkPasswordBreachedCached(
  password: string,
  ttlMs: number = 3600000
): Promise<number> {
  const hash = createHash('sha1').update(password).digest('hex');
  const cacheKey = hash.slice(0, 10); // Use partial hash as cache key

  const cached = breachCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.count;
  }

  const count = await checkPasswordBreached(password);
  breachCache.set(cacheKey, { count, timestamp: Date.now() });

  // Limit cache size
  if (breachCache.size > 10000) {
    const oldestKey = breachCache.keys().next().value;
    if (oldestKey) breachCache.delete(oldestKey);
  }

  return count;
}

// ============================================================================
// PASSWORD HASHING (using bcryptjs from existing deps)
// ============================================================================

/**
 * Hash password with bcrypt
 *
 * Note: Uses bcryptjs which is already in package.json
 */
export async function hashPassword(
  password: string,
  config: Partial<PasswordConfig> = {}
): Promise<string> {
  const mergedConfig = { ...DEFAULT_PASSWORD_CONFIG, ...config };

  // Dynamic import to support environments without bcrypt
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, mergedConfig.bcryptRounds);
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, storedHash);
  } catch (error) {
    console.error('[Password] Verification failed:', error);
    return false;
  }
}

/**
 * Check if password hash needs rehashing (cost factor increased)
 */
export async function needsRehash(
  storedHash: string,
  config: Partial<PasswordConfig> = {}
): Promise<boolean> {
  const mergedConfig = { ...DEFAULT_PASSWORD_CONFIG, ...config };

  // Extract rounds from bcrypt hash format: $2a$XX$...
  const match = storedHash.match(/^\$2[aby]?\$(\d+)\$/);
  if (!match) {
    return true; // Invalid hash format
  }

  const currentRounds = parseInt(match[1], 10);
  return currentRounds < mergedConfig.bcryptRounds;
}

// ============================================================================
// PASSWORD STRENGTH CALCULATION
// ============================================================================

/**
 * Calculate password strength
 */
function calculatePasswordStrength(
  password: string,
  errorCount: number
): PasswordValidationResult['strength'] {
  if (errorCount > 0) {
    return 'weak';
  }

  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;

  // Character diversity
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;

  // Bonus for mixed case within words
  if (/[a-z][A-Z]|[A-Z][a-z]/.test(password)) score += 1;

  // Penalty for patterns
  if (hasSequentialChars(password, 3)) score -= 1;
  if (hasRepeatedChars(password, 3)) score -= 1;

  if (score >= 8) return 'strong';
  if (score >= 6) return 'good';
  if (score >= 4) return 'fair';
  return 'weak';
}

/**
 * Estimate entropy bits (simplified)
 */
export function estimatePasswordEntropy(password: string): number {
  let charsetSize = 0;

  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/\d/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z\d]/.test(password)) charsetSize += 32;

  if (charsetSize === 0) return 0;

  return Math.floor(Math.log2(Math.pow(charsetSize, password.length)));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check for sequential characters
 */
function hasSequentialChars(password: string, minLength: number): boolean {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    'zyxwvutsrqponmlkjihgfedcba',
    '01234567890',
    '09876543210',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
  ];

  const lower = password.toLowerCase();

  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - minLength; i++) {
      if (lower.includes(seq.slice(i, i + minLength))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check for repeated characters
 */
function hasRepeatedChars(password: string, minLength: number): boolean {
  const regex = new RegExp(`(.)\\1{${minLength - 1},}`);
  return regex.test(password);
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(length);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

/**
 * Generate passphrase (more memorable, high entropy)
 */
export function generatePassphrase(wordCount: number = 4): string {
  // Simple word list for demonstration
  const words = [
    'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'galaxy', 'harbor',
    'island', 'jungle', 'kindle', 'lemon', 'mountain', 'nebula', 'ocean', 'phoenix',
    'quartz', 'river', 'sunset', 'thunder', 'umbrella', 'valley', 'whisper', 'xenon',
    'yellow', 'zenith', 'anchor', 'bridge', 'crystal', 'diamond', 'emerald', 'falcon',
  ];

  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(wordCount);

  const passphrase: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const wordIndex = randomBytes[i] % words.length;
    // Capitalize first letter randomly
    const word = randomBytes[i] % 2 === 0
      ? words[wordIndex]
      : words[wordIndex].charAt(0).toUpperCase() + words[wordIndex].slice(1);
    passphrase.push(word);
  }

  // Add a random number at the end
  const num = crypto.randomBytes(1)[0] % 100;
  passphrase.push(num.toString());

  return passphrase.join('-');
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DEFAULT_PASSWORD_CONFIG, COMMON_PASSWORDS };
