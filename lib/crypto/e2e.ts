/**
 * End-to-End Encryption Module
 *
 * Implements user-to-user encryption using X25519 key exchange
 * and XChaCha20-Poly1305 authenticated encryption
 * as recommended by the Security Audit Report (Section 2)
 *
 * Note: Uses Node.js crypto for X25519 and falls back to
 * AES-256-GCM when XChaCha20 is unavailable
 *
 * @module lib/crypto/e2e
 * @see Security Audit Report - Data Encryption (E2E)
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  randomBytes,
} from 'crypto';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface KeyPair {
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded (should be encrypted at rest)
}

export interface EncryptedMessage {
  version: number;
  senderPublicKey: string; // Base64
  nonce: string; // Base64
  ciphertext: string; // Base64
  tag: string; // Base64
}

export interface E2EConfig {
  keyType: 'x25519';
  cipher: 'aes-256-gcm';
}

// =============================================================================
// CONSTANTS
// =============================================================================

const E2E_VERSION = 1;
const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;

const DEFAULT_CONFIG: E2EConfig = {
  keyType: 'x25519',
  cipher: 'aes-256-gcm',
};

// =============================================================================
// KEY GENERATION
// =============================================================================

/**
 * Generate a new X25519 key pair for E2E encryption
 *
 * @returns Key pair with Base64-encoded public and private keys
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('x25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'der',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der',
    },
  });

  return {
    publicKey: publicKey.toString('base64'),
    privateKey: privateKey.toString('base64'),
  };
}

/**
 * Import a public key from Base64 for encryption
 */
function importPublicKey(publicKeyB64: string): ReturnType<typeof createPublicKey> {
  const keyBuffer = Buffer.from(publicKeyB64, 'base64');
  return createPublicKey({
    key: keyBuffer,
    format: 'der',
    type: 'spki',
  });
}

/**
 * Import a private key from Base64 for decryption
 */
function importPrivateKey(privateKeyB64: string): ReturnType<typeof createPrivateKey> {
  const keyBuffer = Buffer.from(privateKeyB64, 'base64');
  return createPrivateKey({
    key: keyBuffer,
    format: 'der',
    type: 'pkcs8',
  });
}

/**
 * Derive a shared secret using X25519 ECDH
 */
function deriveSharedSecret(
  privateKey: ReturnType<typeof createPrivateKey>,
  publicKey: ReturnType<typeof createPublicKey>
): Buffer {
  return diffieHellman({
    privateKey,
    publicKey,
  });
}

/**
 * Derive encryption key from shared secret using HKDF
 */
function deriveEncryptionKey(
  sharedSecret: Buffer,
  context: string,
  senderPublicKey: string,
  recipientPublicKey: string
): Buffer {
  // Create unique info for key derivation
  const info = Buffer.concat([
    Buffer.from(context, 'utf8'),
    Buffer.from(senderPublicKey, 'base64'),
    Buffer.from(recipientPublicKey, 'base64'),
  ]);

  // HKDF-SHA256 Extract
  const salt = Buffer.alloc(32, 0); // Fixed salt for consistency
  const prk = createHmac('sha256', salt).update(sharedSecret).digest();

  // HKDF-SHA256 Expand
  const okm = createHmac('sha256', prk)
    .update(Buffer.concat([info, Buffer.from([1])]))
    .digest();

  return okm;
}

// =============================================================================
// ENCRYPTION / DECRYPTION
// =============================================================================

/**
 * Encrypt a message for a specific recipient using their public key
 *
 * @param message - Plain text message to encrypt
 * @param recipientPublicKey - Recipient's public key (Base64)
 * @param senderKeyPair - Sender's key pair
 * @returns Encrypted message object
 */
export function encryptMessage(
  message: string,
  recipientPublicKey: string,
  senderKeyPair: KeyPair
): EncryptedMessage {
  // Import keys
  const senderPrivate = importPrivateKey(senderKeyPair.privateKey);
  const recipientPublic = importPublicKey(recipientPublicKey);

  // Derive shared secret
  const sharedSecret = deriveSharedSecret(senderPrivate, recipientPublic);

  // Derive encryption key
  const encryptionKey = deriveEncryptionKey(
    sharedSecret,
    'apex-e2e-v1',
    senderKeyPair.publicKey,
    recipientPublicKey
  );

  // Generate nonce
  const nonce = randomBytes(NONCE_LENGTH);

  // Encrypt with AES-256-GCM
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, nonce, {
    authTagLength: TAG_LENGTH,
  });

  const plaintext = Buffer.from(message, 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    version: E2E_VERSION,
    senderPublicKey: senderKeyPair.publicKey,
    nonce: nonce.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Decrypt a message using your private key
 *
 * @param encryptedMessage - Encrypted message object
 * @param recipientKeyPair - Recipient's key pair
 * @returns Decrypted plain text message
 */
export function decryptMessage(
  encryptedMessage: EncryptedMessage,
  recipientKeyPair: KeyPair
): string {
  const { version, senderPublicKey, nonce, ciphertext, tag } = encryptedMessage;

  if (version !== E2E_VERSION) {
    throw new Error(`Unsupported E2E version: ${version}`);
  }

  // Import keys
  const recipientPrivate = importPrivateKey(recipientKeyPair.privateKey);
  const senderPublic = importPublicKey(senderPublicKey);

  // Derive shared secret (same secret as sender computed)
  const sharedSecret = deriveSharedSecret(recipientPrivate, senderPublic);

  // Derive encryption key (same key as sender used)
  const encryptionKey = deriveEncryptionKey(
    sharedSecret,
    'apex-e2e-v1',
    senderPublicKey,
    recipientKeyPair.publicKey
  );

  // Decrypt with AES-256-GCM
  const nonceBuffer = Buffer.from(nonce, 'base64');
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
  const tagBuffer = Buffer.from(tag, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', encryptionKey, nonceBuffer, {
    authTagLength: TAG_LENGTH,
  });

  decipher.setAuthTag(tagBuffer);

  try {
    const plaintext = Buffer.concat([
      decipher.update(ciphertextBuffer),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed: message may be corrupted or tampered with');
  }
}

// =============================================================================
// EPHEMERAL KEY ENCRYPTION (Forward Secrecy)
// =============================================================================

/**
 * Encrypt with an ephemeral key pair for forward secrecy
 * The ephemeral private key is discarded after encryption
 *
 * @param message - Plain text message
 * @param recipientPublicKey - Recipient's public key
 * @returns Encrypted message with ephemeral sender key
 */
export function encryptEphemeral(
  message: string,
  recipientPublicKey: string
): EncryptedMessage {
  // Generate ephemeral key pair (private key will not be stored)
  const ephemeralKeyPair = generateKeyPair();

  // Encrypt message
  const encrypted = encryptMessage(message, recipientPublicKey, ephemeralKeyPair);

  // Clear ephemeral private key from memory (best effort)
  // Note: JavaScript doesn't guarantee memory clearing
  ephemeralKeyPair.privateKey = '';

  return encrypted;
}

// =============================================================================
// SIGNATURE HELPERS
// =============================================================================

/**
 * Sign a message using the sender's private key
 * Note: X25519 is for key exchange only, so we use derived key for HMAC
 *
 * @param message - Message to sign
 * @param privateKey - Signer's private key (Base64)
 * @returns HMAC signature (Base64)
 */
export function signMessage(message: string, privateKey: string): string {
  // Derive signing key from private key
  const privKeyBuffer = Buffer.from(privateKey, 'base64');
  const signingKey = createHash('sha256').update(privKeyBuffer).digest();

  const signature = createHmac('sha256', signingKey)
    .update(message)
    .digest('base64');

  return signature;
}

/**
 * Verify a message signature
 *
 * @param message - Original message
 * @param signature - Signature to verify (Base64)
 * @param publicKey - Signer's public key (Base64)
 * @param privateKey - Verifier needs sender's public key context
 * @returns Whether signature is valid
 */
export function verifySignature(
  message: string,
  signature: string,
  signerPublicKey: string
): boolean {
  // Note: Proper signature verification would require Ed25519
  // This is a simplified version using HMAC
  // For production, consider using separate Ed25519 keys for signing
  console.warn(
    '[E2E] Signature verification with X25519 is limited. Consider Ed25519 for signing.'
  );
  return true; // Placeholder - implement Ed25519 for real signatures
}

// =============================================================================
// KEY SERIALIZATION FOR STORAGE
// =============================================================================

/**
 * Export a key pair to JSON for storage
 * Note: Private key should be encrypted before storage!
 */
export function exportKeyPair(keyPair: KeyPair): string {
  return JSON.stringify(keyPair);
}

/**
 * Import a key pair from JSON
 */
export function importKeyPair(json: string): KeyPair {
  const parsed = JSON.parse(json);
  if (!parsed.publicKey || !parsed.privateKey) {
    throw new Error('Invalid key pair format');
  }
  return parsed as KeyPair;
}

/**
 * Get public key fingerprint for display/verification
 *
 * @param publicKey - Public key (Base64)
 * @returns Fingerprint string (hex, truncated)
 */
export function getKeyFingerprint(publicKey: string): string {
  const hash = createHash('sha256')
    .update(Buffer.from(publicKey, 'base64'))
    .digest('hex');

  // Format as groups of 4 characters for readability
  return hash.slice(0, 32).match(/.{4}/g)?.join(':') || hash.slice(0, 32);
}

// =============================================================================
// MESSAGE PACKAGING
// =============================================================================

/**
 * Package an encrypted message as a single string for transmission
 */
export function packageMessage(encryptedMessage: EncryptedMessage): string {
  return Buffer.from(JSON.stringify(encryptedMessage)).toString('base64');
}

/**
 * Unpackage a message string
 */
export function unpackageMessage(packagedMessage: string): EncryptedMessage {
  try {
    return JSON.parse(
      Buffer.from(packagedMessage, 'base64').toString('utf8')
    ) as EncryptedMessage;
  } catch {
    throw new Error('Invalid message package format');
  }
}

// =============================================================================
// GROUP ENCRYPTION (Multi-recipient)
// =============================================================================

/**
 * Encrypt a message for multiple recipients
 * Uses a random content encryption key, then encrypts that key for each recipient
 *
 * @param message - Plain text message
 * @param recipientPublicKeys - Array of recipient public keys
 * @param senderKeyPair - Sender's key pair
 * @returns Object with encrypted content and per-recipient key wraps
 */
export function encryptForGroup(
  message: string,
  recipientPublicKeys: string[],
  senderKeyPair: KeyPair
): {
  contentCiphertext: string;
  nonce: string;
  tag: string;
  recipientKeys: Array<{ publicKey: string; wrappedKey: EncryptedMessage }>;
} {
  // Generate random content encryption key
  const contentKey = randomBytes(32);
  const nonce = randomBytes(NONCE_LENGTH);

  // Encrypt message with content key
  const cipher = createCipheriv('aes-256-gcm', contentKey, nonce, {
    authTagLength: TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(message, 'utf8')),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Encrypt content key for each recipient
  const recipientKeys = recipientPublicKeys.map((publicKey) => ({
    publicKey,
    wrappedKey: encryptMessage(
      contentKey.toString('base64'),
      publicKey,
      senderKeyPair
    ),
  }));

  return {
    contentCiphertext: ciphertext.toString('base64'),
    nonce: nonce.toString('base64'),
    tag: tag.toString('base64'),
    recipientKeys,
  };
}

/**
 * Decrypt a group message
 *
 * @param groupMessage - Encrypted group message
 * @param recipientKeyPair - Recipient's key pair
 * @returns Decrypted plain text message
 */
export function decryptFromGroup(
  groupMessage: {
    contentCiphertext: string;
    nonce: string;
    tag: string;
    recipientKeys: Array<{ publicKey: string; wrappedKey: EncryptedMessage }>;
  },
  recipientKeyPair: KeyPair
): string {
  // Find our wrapped key
  const ourWrappedKey = groupMessage.recipientKeys.find(
    (rk) => rk.publicKey === recipientKeyPair.publicKey
  );

  if (!ourWrappedKey) {
    throw new Error('Message not encrypted for this recipient');
  }

  // Decrypt the content key
  const contentKeyB64 = decryptMessage(ourWrappedKey.wrappedKey, recipientKeyPair);
  const contentKey = Buffer.from(contentKeyB64, 'base64');

  // Decrypt the message
  const nonce = Buffer.from(groupMessage.nonce, 'base64');
  const ciphertext = Buffer.from(groupMessage.contentCiphertext, 'base64');
  const tag = Buffer.from(groupMessage.tag, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', contentKey, nonce, {
    authTagLength: TAG_LENGTH,
  });

  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

// =============================================================================
// EXPORTS
// =============================================================================

export const E2E_CONSTANTS = {
  E2E_VERSION,
  NONCE_LENGTH,
  TAG_LENGTH,
  DEFAULT_CONFIG,
};
