# Security Implementation Guide

**Document Version:** 1.0
**Last Updated:** December 2025
**Classification:** Internal - Development Team
**Reference:** Security Audit Report Implementation

## Overview

This guide documents the security infrastructure implemented for Apex Intelligence as part of the Security Audit recommendations. It covers authentication hardening, data encryption, compliance APIs, and best practices for secure development.

---

## Table of Contents

1. [Authentication Hardening](#1-authentication-hardening)
2. [Data Encryption](#2-data-encryption)
3. [Compliance (GDPR/CCPA)](#3-compliance-gdprccpa)
4. [Session Management](#4-session-management)
5. [Database Schema](#5-database-schema)
6. [Environment Configuration](#6-environment-configuration)
7. [Security Checklist](#7-security-checklist)

---

## 1. Authentication Hardening

### 1.1 Multi-Factor Authentication (MFA)

**Location:** `lib/auth/mfa.ts`

The MFA module implements TOTP (Time-based One-Time Password) and SMS-based two-factor authentication.

#### TOTP Setup

```typescript
import { generateTOTPSecret, verifyTOTPToken } from '@/lib/auth/mfa';

// Generate secret for new user
const secret = generateTOTPSecret(userId, userEmail);
// Returns: { base32: 'JBSWY3DPEHPK3PXP', otpauthUrl: 'otpauth://totp/...' }

// Generate QR code from otpauthUrl for authenticator apps

// Verify token during login
const result = verifyTOTPToken(secret.base32, userInputToken);
if (result.valid) {
  // MFA verified
}
```

#### SMS Verification

```typescript
import { generateSMSCode, verifySMSCode, sendSMSCode } from '@/lib/auth/mfa';

// Generate and send code
const { code, hash, expiresAt } = generateSMSCode();
await sendSMSCode(phoneNumber, code);

// Store hash and expiresAt in session/Redis

// Verify user input
const valid = verifySMSCode(userInput, storedHash, storedExpiresAt);
```

#### Backup Codes

```typescript
import { generateBackupCodes, verifyBackupCode } from '@/lib/auth/mfa';

// Generate on MFA setup
const backupCodes = generateBackupCodes(10);
// Store hashes in database, show codes to user ONCE

// Verify backup code
const usedIndex = verifyBackupCode(userInput, storedHashes);
if (usedIndex >= 0) {
  // Remove used code from stored hashes
}
```

### 1.2 Password Security

**Location:** `lib/auth/password.ts`

#### Password Validation

```typescript
import { validatePassword, hashPassword, verifyPassword } from '@/lib/auth/password';

// Validate new password
const validation = await validatePassword(newPassword, { email: user.email, name: user.name });
if (!validation.valid) {
  // Return validation.errors to user
}

// Hash password for storage (12 rounds bcrypt-compatible)
const hash = hashPassword(newPassword);

// Verify on login
const matches = verifyPassword(inputPassword, storedHash);
```

#### Password Policy

Default policy (configurable):
- Minimum 12 characters
- Requires uppercase, lowercase, numbers, symbols
- Checks against common passwords
- Checks against user's email/name
- Checks Have I Been Pwned database
- Minimum strength score: "fair"

### 1.3 HIBP Integration

The password module automatically checks passwords against the Have I Been Pwned database using k-Anonymity (only sends first 5 chars of SHA-1 hash).

```typescript
import { checkHIBP } from '@/lib/auth/password';

const breachCount = await checkHIBP(password);
if (breachCount > 0) {
  console.log(`Password found in ${breachCount} breaches`);
}
```

---

## 2. Data Encryption

### 2.1 At-Rest Encryption

**Location:** `lib/crypto/encryption.ts`

Uses AES-256-GCM with HKDF key derivation.

#### Basic Encryption

```typescript
import { encrypt, decrypt, encryptToString, decryptFromString } from '@/lib/crypto/encryption';

// Encrypt data
const encrypted = encrypt('sensitive data', 'context:identifier');

// Decrypt data
const plaintext = decrypt(encrypted, 'context:identifier');

// Single string format (for database storage)
const encryptedString = encryptToString('sensitive data', 'context');
const decrypted = decryptFromString(encryptedString, 'context');
```

#### Field-Level Encryption

```typescript
import { encryptField, decryptField } from '@/lib/crypto/encryption';

// Encrypt a database field
const encryptedEmail = encryptField(email, 'users', 'email', odId?');
// Store encryptedEmail in database

// Decrypt when reading
const email = decryptField(encryptedEmail, 'users', 'email', odId?');
```

#### Searchable Encryption

```typescript
import { hashForSearch } from '@/lib/crypto/encryption';

// Create deterministic hash for searching
const emailHash = hashForSearch(email, 'user:email');
// Store alongside encrypted data, query by hash
```

### 2.2 End-to-End Encryption

**Location:** `lib/crypto/e2e.ts`

Uses X25519 key exchange with AES-256-GCM.

#### Key Generation

```typescript
import { generateKeyPair, getKeyFingerprint } from '@/lib/crypto/e2e';

// Generate key pair for user
const keyPair = generateKeyPair();
// Store publicKey in database
// Encrypt and store privateKey securely

// Display fingerprint for verification
const fingerprint = getKeyFingerprint(keyPair.publicKey);
// Shows like: "a1b2:c3d4:e5f6:7890:..."
```

#### Message Encryption

```typescript
import { encryptMessage, decryptMessage } from '@/lib/crypto/e2e';

// Encrypt message for recipient
const encrypted = encryptMessage(
  'Hello!',
  recipientPublicKey,
  senderKeyPair
);

// Decrypt received message
const plaintext = decryptMessage(encrypted, recipientKeyPair);
```

#### Forward Secrecy

```typescript
import { encryptEphemeral } from '@/lib/crypto/e2e';

// Encrypt with ephemeral key (private key discarded)
const encrypted = encryptEphemeral(message, recipientPublicKey);
// Recipient can decrypt, but sender cannot recover the message
```

---

## 3. Compliance (GDPR/CCPA)

### 3.1 Data Export API

**Location:** `app/api/gdpr/export/route.ts`

```bash
# Request data export
GET /api/gdpr/export
Authorization: Bearer <token>

# Response: JSON or CSV file download
```

The export includes:
- User profile
- Portfolio data
- Watchlist
- Transaction history
- Security events (limited)
- Consent records

### 3.2 Data Deletion API

**Location:** `app/api/gdpr/delete/route.ts`

```bash
# Request account deletion
POST /api/gdpr/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "confirmation": "DELETE_MY_ACCOUNT",
  "reason": "optional reason"
}

# Response: Verification email sent
```

Deletion process:
1. User requests deletion with explicit confirmation
2. Verification email sent
3. User confirms via link
4. 30-day waiting period
5. Data anonymized/deleted

### 3.3 Consent Management

Track user consents with the `user_consents` table:

```typescript
// Record consent
await db.insert(userConsents).values({
  userId,
  consentType: 'marketing_emails',
  version: '1.0',
  granted: true,
  ipAddress,
});

// Withdraw consent
await db.update(userConsents)
  .set({ withdrawnAt: new Date() })
  .where(and(
    eq(userConsents.userId, userId),
    eq(userConsents.consentType, 'marketing_emails'),
    isNull(userConsents.withdrawnAt)
  ));
```

---

## 4. Session Management

**Location:** `lib/auth/session.ts`

### 4.1 Creating Sessions

```typescript
import { createSession, parseDeviceInfo, generateDeviceFingerprint } from '@/lib/auth/session';

// Generate device fingerprint
const fingerprint = generateDeviceFingerprint(
  userAgent,
  acceptLanguage,
  acceptEncoding,
  ipAddress
);

// Parse device info
const deviceInfo = parseDeviceInfo(userAgent, fingerprint);

// Create session
const session = await createSession(
  userId,
  deviceInfo,
  ipAddress,
  mfaVerified
);

// session.id is the session token to store in cookie
```

### 4.2 Validating Sessions

```typescript
import { validateSession } from '@/lib/auth/session';

const result = await validateSession(sessionId);
if (!result.valid) {
  // Handle: result.reason is 'expired', 'revoked', 'not_found', or 'idle_timeout'
}

// session automatically refreshed on activity
```

### 4.3 Session Management

```typescript
import { getUserSessions, revokeSession, revokeAllSessions } from '@/lib/auth/session';

// List user's active sessions
const sessions = await getUserSessions(userId);

// Revoke specific session (e.g., logout)
await revokeSession(sessionId);

// Revoke all sessions except current ("Logout all devices")
await revokeAllSessions(userId, currentSessionId);
```

### 4.4 Configuration

Default configuration:
- **Idle timeout:** 30 minutes
- **Absolute timeout:** 7 days
- **Max sessions per user:** 10

Override via environment or function parameters.

---

## 5. Database Schema

### 5.1 SQL Migration

**Location:** `lib/db/migrations/001_security_encryption.sql`

Run the migration to add security tables:

```bash
psql $DATABASE_URL < lib/db/migrations/001_security_encryption.sql
```

### 5.2 Drizzle Schema

**Location:** `packages/db/src/schema/security.ts`

New tables:
- `user_sessions` - Session management
- `mfa_attempts` - MFA audit trail
- `user_encrypted_data` - Field-level encrypted PII
- `encryption_keys` - Key management
- `gdpr_requests` - Data subject requests
- `data_retention_log` - Retention audit trail
- `user_consents` - Consent tracking
- `security_events` - Security event log
- `e2e_messages` - E2E encrypted messages

### 5.3 User Table Extensions

The migration adds these columns to the `users` table:

```sql
password_hash TEXT
password_updated_at TIMESTAMP
mfa_enabled BOOLEAN
mfa_secret TEXT
mfa_backup_codes JSONB
mfa_phone TEXT
mfa_verified_at TIMESTAMP
failed_login_attempts INTEGER
last_failed_login_at TIMESTAMP
locked_until TIMESTAMP
e2e_public_key TEXT
e2e_key_created_at TIMESTAMP
```

---

## 6. Environment Configuration

### Required Environment Variables

```bash
# Encryption (REQUIRED for production)
ENCRYPTION_MASTER_KEY=<64-char-hex-string>

# SMS (for SMS-based MFA)
TWILIO_SID=ACxxxxxxx
TWILIO_TOKEN=xxxxxxx
TWILIO_PHONE=+1234567890
SMS_CODE_SECRET=<random-secret>

# Backup codes
BACKUP_CODE_SECRET=<random-secret>

# Redis (for session management)
REDIS_URL=redis://localhost:6379
# or
UPSTASH_REDIS_REST_URL=https://...

# Database
DATABASE_URL=postgresql://...
```

### Generating Secrets

```bash
# Generate 256-bit encryption key
openssl rand -hex 32

# Generate SMS code secret
openssl rand -base64 32

# Generate backup code secret
openssl rand -base64 32
```

---

## 7. Security Checklist

### Pre-Production

- [ ] Generate and securely store ENCRYPTION_MASTER_KEY
- [ ] Configure Twilio for SMS MFA (optional)
- [ ] Run database migration
- [ ] Set up Redis for session management
- [ ] Configure rate limiting
- [ ] Enable HTTPS/TLS
- [ ] Set secure cookie attributes (HttpOnly, Secure, SameSite)
- [ ] Configure CSP headers

### Ongoing

- [ ] Rotate encryption keys quarterly
- [ ] Review security events weekly
- [ ] Process GDPR requests within 30 days
- [ ] Run quarterly penetration tests
- [ ] Update dependencies monthly
- [ ] Review access logs for anomalies
- [ ] Test disaster recovery procedures

### Monitoring

- [ ] Alert on high MFA failure rates
- [ ] Alert on suspicious security events
- [ ] Alert on GDPR request backlog
- [ ] Monitor session creation patterns
- [ ] Track password breach checks

---

## API Reference

### MFA Module (`lib/auth/mfa.ts`)

| Function | Description |
|----------|-------------|
| `generateTOTPSecret(userId, email)` | Generate TOTP secret for user |
| `verifyTOTPToken(secret, token)` | Verify TOTP token |
| `generateSMSCode()` | Generate SMS verification code |
| `verifySMSCode(input, hash, expires)` | Verify SMS code |
| `sendSMSCode(phone, code)` | Send SMS via Twilio |
| `checkMFALockout(attempts, lastFailed)` | Check lockout status |
| `generateBackupCodes(count)` | Generate backup codes |
| `verifyBackupCode(input, hashes)` | Verify backup code |

### Password Module (`lib/auth/password.ts`)

| Function | Description |
|----------|-------------|
| `validatePassword(password, userInfo)` | Validate against policy |
| `hashPassword(password)` | Hash with bcrypt-compatible algo |
| `verifyPassword(password, hash)` | Verify password hash |
| `needsRehash(hash)` | Check if hash needs upgrade |
| `checkHIBP(password)` | Check Have I Been Pwned |
| `calculateStrength(password)` | Calculate password strength |
| `generateSecurePassword(length)` | Generate random password |

### Encryption Module (`lib/crypto/encryption.ts`)

| Function | Description |
|----------|-------------|
| `encrypt(data, context)` | Encrypt with AES-256-GCM |
| `decrypt(encrypted, context)` | Decrypt data |
| `encryptToString(data, context)` | Encrypt to base64 string |
| `decryptFromString(string, context)` | Decrypt from base64 |
| `encryptField(value, table, field)` | Field-level encryption |
| `decryptField(value, table, field)` | Field-level decryption |
| `hashForSearch(value, context)` | Searchable hash |
| `rotateEncryption(data, oldCtx, newCtx)` | Key rotation |

### E2E Module (`lib/crypto/e2e.ts`)

| Function | Description |
|----------|-------------|
| `generateKeyPair()` | Generate X25519 key pair |
| `encryptMessage(msg, pubKey, keyPair)` | Encrypt for recipient |
| `decryptMessage(encrypted, keyPair)` | Decrypt message |
| `encryptEphemeral(msg, pubKey)` | Encrypt with forward secrecy |
| `getKeyFingerprint(pubKey)` | Get key fingerprint |
| `encryptForGroup(msg, pubKeys, keyPair)` | Multi-recipient encryption |
| `decryptFromGroup(msg, keyPair)` | Decrypt group message |

### Session Module (`lib/auth/session.ts`)

| Function | Description |
|----------|-------------|
| `createSession(userId, device, ip)` | Create new session |
| `validateSession(sessionId)` | Validate and refresh |
| `revokeSession(sessionId)` | Revoke single session |
| `revokeAllSessions(userId, except?)` | Revoke all user sessions |
| `getUserSessions(userId)` | List active sessions |
| `updateSessionMFA(sessionId, verified)` | Update MFA status |
| `generateDeviceFingerprint(...)` | Create device fingerprint |
| `parseDeviceInfo(userAgent, fingerprint)` | Parse device info |

---

## Support

For security-related questions or to report vulnerabilities:
- Internal: #security channel
- External: security@apex-intelligence.io

For bug bounty submissions:
- HackerOne: [Coming Soon]
