/**
 * Federated Identity System
 *
 * OpenID Connect (OIDC) federation for cross-instance authentication.
 * Enables users to log in across community-hosted Apex nodes with RC portability.
 *
 * Trade-offs:
 * - GOOD: Enables seamless migration between instances
 * - BAD: Central hub is temporary SPOF; migrate to DID (Decentralized ID) later
 * - GOOD: Portability supports federation
 * - BAD: Relies on hub; evolve to peer-to-peer auth for full decentralization
 *
 * @see OpenID Connect Core 1.0
 * @see OAuth 2.0 (RFC 6749)
 * @see PKCE Extension (RFC 7636)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { signJwt } from './jwt';

// ============================================================================
// TYPES
// ============================================================================

export interface OidcConfig {
  /** OIDC Issuer URL (e.g., https://hub.apex.com) */
  issuer: string;
  /** Client ID for this instance */
  clientId: string;
  /** Client secret (for confidential clients) */
  clientSecret?: string;
  /** Redirect URI after authentication */
  redirectUri: string;
  /** Scopes to request */
  scopes: string[];
  /** Response type (code for authorization code flow) */
  responseType: 'code' | 'token' | 'id_token';
  /** Token endpoint auth method */
  tokenEndpointAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'none';
}

export interface OidcDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  claims_supported?: string[];
  code_challenge_methods_supported?: string[];
}

export interface OidcTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface OidcUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  picture?: string;
  /** Custom claim: RC (Reputation Capital) balance */
  rc_balance?: number;
  /** Custom claim: User tier */
  tier?: string;
  /** Custom claim: Federation origin */
  federation_origin?: string;
}

export interface FederatedLoginResult {
  success: boolean;
  user?: OidcUserInfo;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn: number;
  };
  localToken?: string;
  error?: string;
}

export interface PkceChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

// Default configuration
const DEFAULT_OIDC_CONFIG: Partial<OidcConfig> = {
  scopes: ['openid', 'profile', 'email', 'rc_balance'],
  responseType: 'code',
  tokenEndpointAuthMethod: 'client_secret_post',
};

// Discovery document cache
const discoveryCache = new Map<string, { doc: OidcDiscoveryDocument; expires: number }>();

// ============================================================================
// PKCE (Proof Key for Code Exchange)
// ============================================================================

/**
 * Generate PKCE challenge
 *
 * PKCE prevents authorization code interception attacks in public clients
 */
export function generatePkceChallenge(): PkceChallenge {
  // Generate random verifier (43-128 chars)
  const codeVerifier = randomBytes(32).toString('base64url');

  // SHA-256 hash of verifier, base64url encoded
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Verify PKCE challenge
 */
export function verifyPkceChallenge(codeVerifier: string, codeChallenge: string): boolean {
  const computedChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return computedChallenge === codeChallenge;
}

// ============================================================================
// OIDC DISCOVERY
// ============================================================================

/**
 * Fetch OIDC discovery document
 */
export async function discoverOidcEndpoints(
  issuer: string
): Promise<OidcDiscoveryDocument> {
  // Check cache
  const cached = discoveryCache.get(issuer);
  if (cached && Date.now() < cached.expires) {
    return cached.doc;
  }

  const discoveryUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;

  try {
    const response = await fetch(discoveryUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Discovery failed: ${response.status}`);
    }

    const doc: OidcDiscoveryDocument = await response.json();

    // Validate required fields
    if (!doc.authorization_endpoint || !doc.token_endpoint || !doc.issuer) {
      throw new Error('Invalid discovery document');
    }

    // Verify issuer matches
    if (doc.issuer !== issuer) {
      throw new Error(`Issuer mismatch: expected ${issuer}, got ${doc.issuer}`);
    }

    // Cache for 1 hour
    discoveryCache.set(issuer, {
      doc,
      expires: Date.now() + 3600000,
    });

    return doc;
  } catch (error) {
    console.error('[OIDC] Discovery failed:', error);
    throw error;
  }
}

// ============================================================================
// AUTHORIZATION FLOW
// ============================================================================

/**
 * Generate authorization URL for federated login
 */
export async function generateAuthorizationUrl(
  config: OidcConfig,
  state: string,
  nonce: string,
  pkce?: PkceChallenge
): Promise<string> {
  const mergedConfig = { ...DEFAULT_OIDC_CONFIG, ...config };

  const discovery = await discoverOidcEndpoints(config.issuer);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: mergedConfig.responseType!,
    scope: mergedConfig.scopes!.join(' '),
    state,
    nonce,
  });

  // Add PKCE parameters if provided
  if (pkce) {
    params.set('code_challenge', pkce.codeChallenge);
    params.set('code_challenge_method', pkce.codeChallengeMethod);
  }

  return `${discovery.authorization_endpoint}?${params.toString()}`;
}

/**
 * Initiate federated login
 */
export async function federatedLogin(
  request: NextRequest,
  config: OidcConfig
): Promise<NextResponse> {
  try {
    const pkce = generatePkceChallenge();
    const state = randomBytes(16).toString('hex');
    const nonce = randomBytes(16).toString('hex');

    const authUrl = await generateAuthorizationUrl(config, state, nonce, pkce);

    // Create response with redirect
    const response = NextResponse.redirect(authUrl);

    // Store PKCE verifier and state in cookies (httpOnly)
    response.cookies.set('oidc_verifier', pkce.codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    response.cookies.set('oidc_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    response.cookies.set('oidc_nonce', nonce, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    console.log('[OIDC] Initiating federated login');
    return response;
  } catch (error) {
    console.error('[OIDC] Federated login failed:', error);
    return NextResponse.json({ error: 'Federated auth error' }, { status: 500 });
  }
}

// ============================================================================
// TOKEN EXCHANGE
// ============================================================================

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  config: OidcConfig,
  code: string,
  codeVerifier: string
): Promise<OidcTokenResponse> {
  const discovery = await discoverOidcEndpoints(config.issuer);

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier,
  });

  // Add client secret if configured
  if (config.clientSecret && config.tokenEndpointAuthMethod === 'client_secret_post') {
    params.set('client_secret', config.clientSecret);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  };

  // Basic auth for client_secret_basic method
  if (config.clientSecret && config.tokenEndpointAuthMethod === 'client_secret_basic') {
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  try {
    const response = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers,
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Token exchange failed: ${errorData.error || response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[OIDC] Token exchange failed:', error);
    throw error;
  }
}

/**
 * Fetch user info from OIDC provider
 */
export async function fetchUserInfo(
  issuer: string,
  accessToken: string
): Promise<OidcUserInfo> {
  const discovery = await discoverOidcEndpoints(issuer);

  try {
    const response = await fetch(discovery.userinfo_endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`UserInfo fetch failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[OIDC] UserInfo fetch failed:', error);
    throw error;
  }
}

// ============================================================================
// CALLBACK HANDLER
// ============================================================================

/**
 * Handle OIDC callback (authorization code flow)
 */
export async function federatedCallback(
  request: NextRequest,
  config: OidcConfig
): Promise<FederatedLoginResult> {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Check for errors from provider
    if (error) {
      const errorDescription = url.searchParams.get('error_description');
      return { success: false, error: `${error}: ${errorDescription}` };
    }

    // Validate required params
    if (!code || !state) {
      return { success: false, error: 'Missing authorization code or state' };
    }

    // Validate state
    const storedState = request.cookies.get('oidc_state')?.value;
    if (!storedState || storedState !== state) {
      return { success: false, error: 'State mismatch - possible CSRF attack' };
    }

    // Get PKCE verifier
    const codeVerifier = request.cookies.get('oidc_verifier')?.value;
    if (!codeVerifier) {
      return { success: false, error: 'Missing PKCE verifier' };
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(config, code, codeVerifier);

    // Fetch user info
    const userInfo = await fetchUserInfo(config.issuer, tokens.access_token);

    console.log(`[OIDC] Federated login successful for ${userInfo.email}`);

    // Generate local JWT for the user
    const localToken = signJwt(
      {
        sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        tier: userInfo.tier,
        rc_balance: userInfo.rc_balance,
        federation_origin: config.issuer,
      },
      process.env.JWT_SECRET || 'apex-secret',
      24 * 60 * 60 // 24 hours
    );

    return {
      success: true,
      user: userInfo,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresIn: tokens.expires_in,
      },
      localToken,
    };
  } catch (error) {
    console.error('[OIDC] Callback failed:', error);
    return { success: false, error: 'Callback processing error' };
  }
}

// ============================================================================
// TOKEN REFRESH
// ============================================================================

/**
 * Refresh tokens using refresh token
 */
export async function refreshFederatedTokens(
  config: OidcConfig,
  refreshToken: string
): Promise<OidcTokenResponse> {
  const discovery = await discoverOidcEndpoints(config.issuer);

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
  });

  if (config.clientSecret) {
    params.set('client_secret', config.clientSecret);
  }

  try {
    const response = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[OIDC] Token refresh failed:', error);
    throw error;
  }
}

// ============================================================================
// FEDERATION MANAGEMENT
// ============================================================================

export interface FederatedIdentityLink {
  provider: string;
  subject: string;
  email?: string;
  linkedAt: Date;
  lastSync: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Link a federated identity to local account
 *
 * In production, this would update the database
 */
export async function linkFederatedIdentity(
  localUserId: string,
  federatedUser: OidcUserInfo,
  provider: string
): Promise<FederatedIdentityLink> {
  const link: FederatedIdentityLink = {
    provider,
    subject: federatedUser.sub,
    email: federatedUser.email,
    linkedAt: new Date(),
    lastSync: new Date(),
    metadata: {
      name: federatedUser.name,
      tier: federatedUser.tier,
      rc_balance: federatedUser.rc_balance,
    },
  };

  // In production: Store in database
  // await db.insert(federatedIdentities).values({
  //   userId: localUserId,
  //   ...link,
  // });

  console.log(`[OIDC] Linked federated identity ${provider}:${federatedUser.sub} to user ${localUserId}`);

  return link;
}

/**
 * Sync RC balance from federated provider
 */
export async function syncFederatedRcBalance(
  localUserId: string,
  federatedUser: OidcUserInfo
): Promise<{ synced: boolean; rcBalance: number }> {
  const rcBalance = federatedUser.rc_balance || 0;

  // In production: Update local user's RC balance
  // await db.update(users).set({ rcBalance }).where(eq(users.id, localUserId));

  console.log(`[OIDC] Synced RC balance ${rcBalance} for user ${localUserId}`);

  return { synced: true, rcBalance };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Validate ID token (simplified)
 *
 * In production, verify signature using provider's JWKS
 */
export function validateIdToken(
  idToken: string,
  expectedNonce: string,
  issuer: string,
  clientId: string
): { valid: boolean; claims?: Record<string, unknown>; error?: string } {
  try {
    // Decode JWT (without verification - for demonstration)
    const [, payloadB64] = idToken.split('.');
    if (!payloadB64) {
      return { valid: false, error: 'Invalid token format' };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Validate issuer
    if (payload.iss !== issuer) {
      return { valid: false, error: 'Issuer mismatch' };
    }

    // Validate audience
    if (payload.aud !== clientId && !payload.aud?.includes?.(clientId)) {
      return { valid: false, error: 'Audience mismatch' };
    }

    // Validate nonce
    if (payload.nonce !== expectedNonce) {
      return { valid: false, error: 'Nonce mismatch' };
    }

    // Validate expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, claims: payload };
  } catch (error) {
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Generate state for OIDC flow
 */
export function generateOidcState(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate nonce for ID token validation
 */
export function generateNonce(): string {
  return randomBytes(16).toString('hex');
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DEFAULT_OIDC_CONFIG };
