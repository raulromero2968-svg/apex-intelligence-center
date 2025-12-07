/**
 * Data Encryption Utilities
 *
 * Implements at-rest encryption using AES-256-GCM for sensitive data
 * as recommended by the Security Audit Report (Section 2)
 *
 * Features:
 * - AES-256-GCM authenticated encryption
 * - Key derivation using HKDF
 * - Key rotation support
 * - Field-level encryption for database columns
 *
 * @module lib/crypto/encryption
 * @see Security Audit Report - Data Encryption
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
} from 'crypto';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface EncryptedData {
  version: number;
  algorithm: string;
  iv: string; // Base64
  tag: string; // Base64 (for GCM auth tag)
  ciphertext: string; // Base64
  keyId?: string; // For key rotation
}

export interface EncryptionKey {
  id: string;
  key: Buffer;
  createdAt: Date;
  rotatedAt?: Date;
  isActive: boolean;
}

export interface EncryptionConfig {
  algorithm: 'aes-256-gcm' | 'aes-256-cbc';
  keyDerivation: 'hkdf' | 'scrypt';
  ivLength: number;
  tagLength: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CURRENT_VERSION = 1;
const AES_256_KEY_LENGTH = 32; // 256 bits
const GCM_IV_LENGTH = 12; // 96 bits recommended for GCM
const GCM_TAG_LENGTH = 16; // 128 bits

const DEFAULT_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyDerivation: 'hkdf',
  ivLength: GCM_IV_LENGTH,
  tagLength: GCM_TAG_LENGTH,
};

// Key cache for performance
const keyCache = new Map<string, Buffer>();

// =============================================================================
// KEY MANAGEMENT
// =============================================================================

/**
 * Get the master encryption key from environment
 * In production, this should come from a secure key management service (KMS)
 */
function getMasterKey(): Buffer {
  const envKey = process.env.ENCRYPTION_MASTER_KEY || process.env.ENCRYPT_KEY;

  if (!envKey) {
    // Development fallback - DO NOT use in production
    console.warn(
      '[Encryption] No ENCRYPTION_MASTER_KEY set, using insecure development key'
    );
    return createHash('sha256').update('apex-dev-encryption-key').digest();
  }

  // If key is hex-encoded
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }

  // Otherwise, derive key from the secret
  return createHash('sha256').update(envKey).digest();
}

/**
 * Derive an encryption key using HKDF
 *
 * @param masterKey - Master key material
 * @param context - Context string for key derivation
 * @param salt - Optional salt
 * @returns Derived 256-bit key
 */
export function deriveKey(
  masterKey: Buffer,
  context: string,
  salt?: Buffer
): Buffer {
  const cacheKey = `${masterKey.toString('hex')}:${context}:${salt?.toString('hex') || ''}`;

  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey)!;
  }

  // HKDF-SHA256 implementation
  const effectiveSalt = salt || Buffer.alloc(32, 0);

  // Extract
  const prk = createHmac('sha256', effectiveSalt).update(masterKey).digest();

  // Expand
  const info = Buffer.from(context, 'utf8');
  const okm = Buffer.alloc(AES_256_KEY_LENGTH);
  let prev = Buffer.alloc(0);

  for (let i = 0; i < Math.ceil(AES_256_KEY_LENGTH / 32); i++) {
    prev = createHmac('sha256', prk)
      .update(Buffer.concat([prev, info, Buffer.from([i + 1])]))
      .digest();
    prev.copy(okm, i * 32, 0, Math.min(32, AES_256_KEY_LENGTH - i * 32));
  }

  keyCache.set(cacheKey, okm);
  return okm;
}

/**
 * Generate a new random encryption key
 */
export function generateKey(): Buffer {
  return randomBytes(AES_256_KEY_LENGTH);
}

/**
 * Generate a key ID for tracking key versions
 */
export function generateKeyId(): string {
  return `key_${randomBytes(8).toString('hex')}`;
}

// =============================================================================
// ENCRYPTION / DECRYPTION
// =============================================================================

/**
 * Encrypt data using AES-256-GCM
 *
 * @param plaintext - Data to encrypt (string or Buffer)
 * @param context - Encryption context (e.g., "user:email", "payment:card")
 * @param config - Optional encryption configuration
 * @returns Encrypted data object
 */
export function encrypt(
  plaintext: string | Buffer,
  context: string,
  config: Partial<EncryptionConfig> = {}
): EncryptedData {
  const { algorithm, ivLength, tagLength } = { ...DEFAULT_CONFIG, ...config };

  const masterKey = getMasterKey();
  const derivedKey = deriveKey(masterKey, context);

  const iv = randomBytes(ivLength);
  const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;

  const cipher = createCipheriv(algorithm, derivedKey, iv, {
    authTagLength: tagLength,
  });

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    version: CURRENT_VERSION,
    algorithm,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };
}

/**
 * Decrypt data encrypted with AES-256-GCM
 *
 * @param encryptedData - Encrypted data object
 * @param context - Encryption context (must match encryption context)
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedData: EncryptedData, context: string): string {
  const { version, algorithm, iv, tag, ciphertext } = encryptedData;

  if (version !== CURRENT_VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  const masterKey = getMasterKey();
  const derivedKey = deriveKey(masterKey, context);

  const ivBuffer = Buffer.from(iv, 'base64');
  const tagBuffer = Buffer.from(tag, 'base64');
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

  const decipher = createDecipheriv(algorithm as any, derivedKey, ivBuffer, {
    authTagLength: tagBuffer.length,
  });

  decipher.setAuthTag(tagBuffer);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertextBuffer),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed: data may be corrupted or tampered with');
  }
}

/**
 * Encrypt data to a single string (convenient for database storage)
 *
 * @param plaintext - Data to encrypt
 * @param context - Encryption context
 * @returns Base64-encoded encrypted string
 */
export function encryptToString(plaintext: string, context: string): string {
  const encrypted = encrypt(plaintext, context);
  return Buffer.from(JSON.stringify(encrypted)).toString('base64');
}

/**
 * Decrypt data from a single string
 *
 * @param encryptedString - Base64-encoded encrypted string
 * @param context - Encryption context
 * @returns Decrypted plaintext
 */
export function decryptFromString(encryptedString: string, context: string): string {
  try {
    const encrypted = JSON.parse(
      Buffer.from(encryptedString, 'base64').toString('utf8')
    ) as EncryptedData;
    return decrypt(encrypted, context);
  } catch (error) {
    throw new Error('Invalid encrypted data format');
  }
}

// =============================================================================
// FIELD-LEVEL ENCRYPTION FOR DATABASE
// =============================================================================

/**
 * Encryption context generator for database fields
 */
export function getFieldContext(table: string, field: string, recordId?: string): string {
  return recordId
    ? `db:${table}:${field}:${recordId}`
    : `db:${table}:${field}`;
}

/**
 * Create encrypted field value for database insertion
 *
 * @param value - Plaintext value
 * @param table - Table name
 * @param field - Field/column name
 * @param recordId - Optional record ID for additional isolation
 * @returns Encrypted string suitable for database storage
 */
export function encryptField(
  value: string,
  table: string,
  field: string,
  recordId?: string
): string {
  const context = getFieldContext(table, field, recordId);
  return encryptToString(value, context);
}

/**
 * Decrypt field value from database
 *
 * @param encryptedValue - Encrypted string from database
 * @param table - Table name
 * @param field - Field/column name
 * @param recordId - Optional record ID
 * @returns Decrypted plaintext value
 */
export function decryptField(
  encryptedValue: string,
  table: string,
  field: string,
  recordId?: string
): string {
  const context = getFieldContext(table, field, recordId);
  return decryptFromString(encryptedValue, context);
}

// =============================================================================
// SENSITIVE DATA HANDLING
// =============================================================================

/**
 * Mask sensitive data for logging/display
 *
 * @param value - Sensitive value
 * @param showFirst - Number of characters to show at start
 * @param showLast - Number of characters to show at end
 * @returns Masked string
 */
export function maskSensitive(
  value: string,
  showFirst: number = 0,
  showLast: number = 4
): string {
  if (value.length <= showFirst + showLast) {
    return '*'.repeat(value.length);
  }

  const first = value.slice(0, showFirst);
  const last = value.slice(-showLast);
  const masked = '*'.repeat(Math.min(value.length - showFirst - showLast, 8));

  return `${first}${masked}${last}`;
}

/**
 * Hash sensitive data for searching (deterministic)
 * Use this when you need to search encrypted fields
 *
 * @param value - Value to hash
 * @param context - Context for domain separation
 * @returns Deterministic hash of the value
 */
export function hashForSearch(value: string, context: string): string {
  const masterKey = getMasterKey();
  return createHmac('sha256', masterKey)
    .update(`${context}:${value.toLowerCase()}`)
    .digest('hex');
}

// =============================================================================
// KEY ROTATION
// =============================================================================

/**
 * Re-encrypt data with a new key (for key rotation)
 *
 * @param encryptedData - Currently encrypted data
 * @param oldContext - Original encryption context
 * @param newContext - New encryption context (can be same)
 * @param newMasterKey - New master key (optional, uses env if not provided)
 * @returns Re-encrypted data
 */
export function rotateEncryption(
  encryptedData: EncryptedData,
  oldContext: string,
  newContext: string,
  newMasterKey?: Buffer
): EncryptedData {
  // Decrypt with old key
  const plaintext = decrypt(encryptedData, oldContext);

  // If new master key provided, temporarily swap
  const originalKey = process.env.ENCRYPTION_MASTER_KEY;
  if (newMasterKey) {
    process.env.ENCRYPTION_MASTER_KEY = newMasterKey.toString('hex');
    keyCache.clear();
  }

  try {
    // Re-encrypt with new key
    return encrypt(plaintext, newContext);
  } finally {
    // Restore original key
    if (newMasterKey && originalKey) {
      process.env.ENCRYPTION_MASTER_KEY = originalKey;
      keyCache.clear();
    }
  }
}

// =============================================================================
// ENVELOPE ENCRYPTION (for large data)
// =============================================================================

/**
 * Encrypt large data using envelope encryption
 * Generates a data key, encrypts data with it, then encrypts the data key
 *
 * @param data - Large data to encrypt
 * @param context - Encryption context
 * @returns Encrypted envelope containing encrypted data key and ciphertext
 */
export function envelopeEncrypt(
  data: Buffer,
  context: string
): { encryptedDataKey: EncryptedData; ciphertext: string; iv: string; tag: string } {
  // Generate random data key
  const dataKey = generateKey();

  // Encrypt data with data key
  const iv = randomBytes(GCM_IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', dataKey, iv, {
    authTagLength: GCM_TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Encrypt data key with master key
  const encryptedDataKey = encrypt(dataKey.toString('base64'), context);

  return {
    encryptedDataKey,
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Decrypt envelope-encrypted data
 *
 * @param envelope - Encrypted envelope
 * @param context - Encryption context
 * @returns Decrypted data
 */
export function envelopeDecrypt(
  envelope: {
    encryptedDataKey: EncryptedData;
    ciphertext: string;
    iv: string;
    tag: string;
  },
  context: string
): Buffer {
  // Decrypt data key
  const dataKeyB64 = decrypt(envelope.encryptedDataKey, context);
  const dataKey = Buffer.from(dataKeyB64, 'base64');

  // Decrypt data
  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  const ciphertext = Buffer.from(envelope.ciphertext, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', dataKey, iv, {
    authTagLength: tag.length,
  });

  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// =============================================================================
// EXPORTS
// =============================================================================

export const ENCRYPTION_CONSTANTS = {
  CURRENT_VERSION,
  AES_256_KEY_LENGTH,
  GCM_IV_LENGTH,
  GCM_TAG_LENGTH,
  DEFAULT_CONFIG,
};
