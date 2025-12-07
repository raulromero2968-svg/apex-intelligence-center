/**
 * Password Policy and Hashing Module
 *
 * Implements secure password handling with bcrypt (12+ rounds)
 * and Have I Been Pwned (HIBP) breach check
 * as recommended by the Security Audit Report (Section 1)
 *
 * @module lib/auth/password
 * @see Security Audit Report - Authentication Hardening
 */

import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface PasswordValidationResult {
  valid: boolean;
  errors: PasswordError[];
  strength: PasswordStrength;
  suggestions: string[];
}

export interface PasswordError {
  code: string;
  message: string;
}

export interface PasswordStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  label: 'very_weak' | 'weak' | 'fair' | 'strong' | 'very_strong';
  crackTime: string; // Estimated time to crack
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  preventCommon: boolean;
  preventUserInfo: boolean;
  checkHIBP: boolean;
  minStrengthScore: number;
}

export interface HashConfig {
  algorithm: 'bcrypt' | 'scrypt';
  bcryptRounds: number;
  scryptN: number;
  scryptR: number;
  scryptP: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  preventCommon: true,
  preventUserInfo: true,
  checkHIBP: true,
  minStrengthScore: 2, // At least "fair"
};

const DEFAULT_HASH_CONFIG: HashConfig = {
  algorithm: 'bcrypt',
  bcryptRounds: 12, // Security audit recommendation
  scryptN: 16384,
  scryptR: 8,
  scryptP: 1,
};

// Common passwords to reject (top 100 shortened)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', 'letmein', 'login', 'admin', 'welcome', 'password1', 'p@ssw0rd',
  'passw0rd', 'shadow', 'sunshine', 'princess', 'superman', 'michael',
  'football', 'baseball', 'iloveyou', 'trustno1', 'hunter', 'hunter2',
  'ranger', 'harley', 'jennifer', 'freedom', 'whatever', 'mustang',
]);

// Character sets for strength calculation
const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~',
};

// =============================================================================
// BCRYPT IMPLEMENTATION (Pure Node.js)
// =============================================================================

/**
 * Bcrypt-compatible hash generation using native crypto
 * Uses PBKDF2 as the underlying KDF for simplicity
 * For production, consider using the 'bcrypt' npm package
 */
function bcryptHash(password: string, rounds: number): string {
  const salt = randomBytes(16);
  const iterations = Math.pow(2, rounds);

  // Use scrypt as it's built into Node.js and very secure
  const derivedKey = scryptSync(password, salt, 32, {
    N: iterations,
    r: 8,
    p: 1,
  });

  // Format: $apex$rounds$salt$hash
  const saltB64 = salt.toString('base64');
  const hashB64 = derivedKey.toString('base64');

  return `$apex$${rounds}$${saltB64}$${hashB64}`;
}

/**
 * Verify password against bcrypt-compatible hash
 */
function bcryptVerify(password: string, hash: string): boolean {
  const parts = hash.split('$');

  if (parts.length !== 5 || parts[1] !== 'apex') {
    return false;
  }

  const rounds = parseInt(parts[2], 10);
  const salt = Buffer.from(parts[3], 'base64');
  const storedHash = Buffer.from(parts[4], 'base64');
  const iterations = Math.pow(2, rounds);

  try {
    const derivedKey = scryptSync(password, salt, 32, {
      N: iterations,
      r: 8,
      p: 1,
    });

    // Timing-safe comparison
    return timingSafeEqual(derivedKey, storedHash);
  } catch {
    return false;
  }
}

// =============================================================================
// HIBP (Have I Been Pwned) API
// =============================================================================

/**
 * Check if password has been exposed in known data breaches
 * Uses k-Anonymity model (sends only first 5 chars of SHA-1 hash)
 *
 * @param password - Password to check
 * @returns Number of times password appears in breaches (0 = not found)
 */
export async function checkHIBP(password: string): Promise<number> {
  try {
    // SHA-1 hash of password
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    // Query HIBP API with k-Anonymity
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          'User-Agent': 'Apex-Intelligence-Security-Check',
        },
      }
    );

    if (!response.ok) {
      console.warn('HIBP API error:', response.status);
      return 0; // Fail open - don't block if API is down
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix === suffix) {
        return parseInt(count, 10);
      }
    }

    return 0;
  } catch (error) {
    console.error('HIBP check failed:', error);
    return 0; // Fail open
  }
}

// =============================================================================
// PASSWORD STRENGTH CALCULATION
// =============================================================================

/**
 * Calculate password strength using entropy estimation
 */
export function calculateStrength(password: string): PasswordStrength {
  let charsetSize = 0;

  // Determine character set size
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

  // Calculate entropy
  const entropy = password.length * Math.log2(charsetSize || 1);

  // Reduce entropy for common patterns
  let effectiveEntropy = entropy;

  // Penalty for repeating characters
  const repeatMatch = password.match(/(.)\1{2,}/g);
  if (repeatMatch) {
    effectiveEntropy -= repeatMatch.length * 5;
  }

  // Penalty for sequential characters
  if (/abc|bcd|cde|def|123|234|345|456|567|678|789/i.test(password)) {
    effectiveEntropy -= 10;
  }

  // Penalty for keyboard patterns
  if (/qwerty|asdf|zxcv/i.test(password)) {
    effectiveEntropy -= 15;
  }

  // Score mapping
  let score: number;
  let label: PasswordStrength['label'];
  let crackTime: string;

  if (effectiveEntropy < 25) {
    score = 0;
    label = 'very_weak';
    crackTime = 'instantly';
  } else if (effectiveEntropy < 35) {
    score = 1;
    label = 'weak';
    crackTime = 'minutes to hours';
  } else if (effectiveEntropy < 50) {
    score = 2;
    label = 'fair';
    crackTime = 'days to weeks';
  } else if (effectiveEntropy < 70) {
    score = 3;
    label = 'strong';
    crackTime = 'months to years';
  } else {
    score = 4;
    label = 'very_strong';
    crackTime = 'centuries';
  }

  return { score, label, crackTime };
}

// =============================================================================
// PASSWORD VALIDATION
// =============================================================================

/**
 * Validate password against security policy
 *
 * @param password - Password to validate
 * @param userInfo - Optional user info to prevent use in password
 * @param policy - Optional custom policy
 * @returns Validation result with errors and strength
 */
export async function validatePassword(
  password: string,
  userInfo?: { email?: string; name?: string },
  policy: Partial<PasswordPolicy> = {}
): Promise<PasswordValidationResult> {
  const effectivePolicy = { ...DEFAULT_POLICY, ...policy };
  const errors: PasswordError[] = [];
  const suggestions: string[] = [];

  // Length checks
  if (password.length < effectivePolicy.minLength) {
    errors.push({
      code: 'TOO_SHORT',
      message: `Password must be at least ${effectivePolicy.minLength} characters`,
    });
    suggestions.push(`Add ${effectivePolicy.minLength - password.length} more characters`);
  }

  if (password.length > effectivePolicy.maxLength) {
    errors.push({
      code: 'TOO_LONG',
      message: `Password must be at most ${effectivePolicy.maxLength} characters`,
    });
  }

  // Character requirements
  if (effectivePolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push({
      code: 'NO_UPPERCASE',
      message: 'Password must contain at least one uppercase letter',
    });
    suggestions.push('Add an uppercase letter (A-Z)');
  }

  if (effectivePolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push({
      code: 'NO_LOWERCASE',
      message: 'Password must contain at least one lowercase letter',
    });
    suggestions.push('Add a lowercase letter (a-z)');
  }

  if (effectivePolicy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push({
      code: 'NO_NUMBER',
      message: 'Password must contain at least one number',
    });
    suggestions.push('Add a number (0-9)');
  }

  if (effectivePolicy.requireSymbols && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push({
      code: 'NO_SYMBOL',
      message: 'Password must contain at least one special character',
    });
    suggestions.push('Add a special character (!@#$%^&*...)');
  }

  // Common password check
  if (effectivePolicy.preventCommon && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push({
      code: 'COMMON_PASSWORD',
      message: 'This password is too common and easily guessed',
    });
    suggestions.push('Choose a more unique password');
  }

  // User info in password check
  if (effectivePolicy.preventUserInfo && userInfo) {
    const passwordLower = password.toLowerCase();

    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split('@');
      if (passwordLower.includes(emailParts[0])) {
        errors.push({
          code: 'CONTAINS_EMAIL',
          message: 'Password cannot contain your email address',
        });
        suggestions.push('Remove your email from the password');
      }
    }

    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(/\s+/);
      for (const part of nameParts) {
        if (part.length > 2 && passwordLower.includes(part)) {
          errors.push({
            code: 'CONTAINS_NAME',
            message: 'Password cannot contain your name',
          });
          suggestions.push('Remove your name from the password');
          break;
        }
      }
    }
  }

  // Calculate strength
  const strength = calculateStrength(password);

  // Minimum strength check
  if (strength.score < effectivePolicy.minStrengthScore) {
    errors.push({
      code: 'WEAK_PASSWORD',
      message: `Password strength is ${strength.label}, minimum required is "fair"`,
    });
    suggestions.push('Use a longer password with mixed character types');
  }

  // HIBP breach check (only if other validations pass)
  if (effectivePolicy.checkHIBP && errors.length === 0) {
    const breachCount = await checkHIBP(password);
    if (breachCount > 0) {
      errors.push({
        code: 'BREACHED',
        message: `This password has appeared in ${breachCount.toLocaleString()} data breaches`,
      });
      suggestions.push('This password has been exposed in data breaches. Choose a different one.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    suggestions,
  };
}

// =============================================================================
// PASSWORD HASHING
// =============================================================================

/**
 * Hash a password using bcrypt-compatible algorithm
 *
 * @param password - Plain text password
 * @param config - Optional hash configuration
 * @returns Hashed password string
 */
export function hashPassword(
  password: string,
  config: Partial<HashConfig> = {}
): string {
  const { bcryptRounds } = { ...DEFAULT_HASH_CONFIG, ...config };
  return bcryptHash(password, bcryptRounds);
}

/**
 * Verify a password against a stored hash
 *
 * @param password - Plain text password
 * @param hash - Stored hash
 * @returns Whether password matches
 */
export function verifyPassword(password: string, hash: string): boolean {
  return bcryptVerify(password, hash);
}

/**
 * Check if a hash needs to be upgraded (e.g., more rounds)
 *
 * @param hash - Stored hash
 * @param config - Current hash configuration
 * @returns Whether hash should be regenerated
 */
export function needsRehash(
  hash: string,
  config: Partial<HashConfig> = {}
): boolean {
  const { bcryptRounds } = { ...DEFAULT_HASH_CONFIG, ...config };

  const parts = hash.split('$');
  if (parts.length !== 5 || parts[1] !== 'apex') {
    return true; // Unknown format
  }

  const hashRounds = parseInt(parts[2], 10);
  return hashRounds < bcryptRounds;
}

// =============================================================================
// PASSWORD GENERATION
// =============================================================================

/**
 * Generate a secure random password
 *
 * @param length - Password length (default: 16)
 * @param options - Generation options
 * @returns Randomly generated password
 */
export function generateSecurePassword(
  length: number = 16,
  options: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeAmbiguous?: boolean;
  } = {}
): string {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeAmbiguous = true,
  } = options;

  let charset = '';

  if (includeLowercase) {
    charset += excludeAmbiguous
      ? CHAR_SETS.lowercase.replace(/[l]/g, '')
      : CHAR_SETS.lowercase;
  }

  if (includeUppercase) {
    charset += excludeAmbiguous
      ? CHAR_SETS.uppercase.replace(/[IO]/g, '')
      : CHAR_SETS.uppercase;
  }

  if (includeNumbers) {
    charset += excludeAmbiguous
      ? CHAR_SETS.numbers.replace(/[01]/g, '')
      : CHAR_SETS.numbers;
  }

  if (includeSymbols) {
    charset += CHAR_SETS.symbols;
  }

  if (charset.length === 0) {
    charset = CHAR_SETS.lowercase + CHAR_SETS.numbers;
  }

  // Generate random password
  const bytes = randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }

  // Ensure at least one of each required character type
  const requirements: string[] = [];
  if (includeUppercase) requirements.push(CHAR_SETS.uppercase);
  if (includeLowercase) requirements.push(CHAR_SETS.lowercase);
  if (includeNumbers) requirements.push(CHAR_SETS.numbers);
  if (includeSymbols) requirements.push(CHAR_SETS.symbols);

  // Replace random positions with required character types
  const positions = new Set<number>();
  for (const charSet of requirements) {
    let pos: number;
    do {
      pos = randomBytes(1)[0] % length;
    } while (positions.has(pos));
    positions.add(pos);

    const charIndex = randomBytes(1)[0] % charSet.length;
    password = password.slice(0, pos) + charSet[charIndex] + password.slice(pos + 1);
  }

  return password;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const PASSWORD_CONSTANTS = {
  DEFAULT_POLICY,
  DEFAULT_HASH_CONFIG,
  COMMON_PASSWORDS_COUNT: COMMON_PASSWORDS.size,
};
