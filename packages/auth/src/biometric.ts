import type { BiometricAuthResult, BiometricConfig } from './types';

const ATTEMPTS_KEY = 'biometric_attempts';
const LOCKOUT_KEY = 'biometric_lockout_until';

const DEFAULT_CONFIG: Required<BiometricConfig> = {
  maxAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes
  promptMessage: 'Authenticate to access Apex Intelligence',
  fallbackLabel: 'Use PIN',
};

/**
 * Authenticate using biometrics (Face ID/Touch ID)
 * Works on both React Native (Expo) and Web (future PWA support)
 */
export async function authenticateBiometric(
  config: BiometricConfig = {}
): Promise<BiometricAuthResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Check if we're in a React Native environment
    if (typeof navigator !== 'undefined' && 'product' in navigator && navigator.product === 'ReactNative') {
      return await authenticateNative(finalConfig);
    }

    // Web environment (future PWA support with WebAuthn)
    return await authenticateWeb(finalConfig);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Native authentication using Expo LocalAuthentication
 */
async function authenticateNative(
  config: Required<BiometricConfig>
): Promise<BiometricAuthResult> {
  // Dynamic import for Expo modules (only available in React Native)
  const LocalAuthentication = await import('expo-local-authentication');
  const SecureStore = await import('expo-secure-store');

  // 1. Check if biometrics are enrolled
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) {
    return {
      success: false,
      error: 'No biometrics enrolled on this device',
    };
  }

  // 2. Check lockout status
  const lockoutUntil = await SecureStore.getItemAsync(LOCKOUT_KEY);
  if (lockoutUntil) {
    const lockoutDate = new Date(lockoutUntil);
    if (lockoutDate > new Date()) {
      return {
        success: false,
        locked: true,
        lockoutUntil: lockoutDate,
        error: `Too many failed attempts. Try again after ${lockoutDate.toLocaleTimeString()}`,
      };
    }
    // Lockout expired, clear it
    await SecureStore.deleteItemAsync(LOCKOUT_KEY);
    await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
  }

  // 3. Attempt authentication
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: config.promptMessage,
    fallbackLabel: config.fallbackLabel,
    disableDeviceFallback: false,
  });

  if (result.success) {
    // Clear any previous failed attempts
    await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
    await SecureStore.deleteItemAsync(LOCKOUT_KEY);
    return { success: true };
  }

  // 4. Handle failed attempt
  const attemptsStr = await SecureStore.getItemAsync(ATTEMPTS_KEY);
  const attempts = attemptsStr ? parseInt(attemptsStr, 10) + 1 : 1;
  await SecureStore.setItemAsync(ATTEMPTS_KEY, attempts.toString());

  // Lock after max attempts
  if (attempts >= config.maxAttempts) {
    const lockoutUntil = new Date(Date.now() + config.lockoutDuration);
    await SecureStore.setItemAsync(LOCKOUT_KEY, lockoutUntil.toISOString());
    return {
      success: false,
      locked: true,
      lockoutUntil,
      error: `Too many failed attempts. Locked until ${lockoutUntil.toLocaleTimeString()}`,
    };
  }

  return {
    success: false,
    error: `Authentication failed. ${config.maxAttempts - attempts} attempts remaining.`,
  };
}

/**
 * Web authentication using WebAuthn (future PWA support)
 */
async function authenticateWeb(
  config: Required<BiometricConfig>
): Promise<BiometricAuthResult> {
  // Check if WebAuthn is supported
  if (!window.PublicKeyCredential) {
    return {
      success: false,
      error: 'Biometric authentication not supported on this browser',
    };
  }

  // TODO: Implement WebAuthn flow for PWA
  // For now, return not supported
  return {
    success: false,
    error: 'Web biometric authentication coming soon',
  };
}

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && 'product' in navigator && navigator.product === 'ReactNative') {
      const LocalAuthentication = await import('expo-local-authentication');
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    }

    // Web: check for WebAuthn
    return typeof window !== 'undefined' && !!window.PublicKeyCredential;
  } catch {
    return false;
  }
}

/**
 * Get supported biometric types
 */
export async function getSupportedBiometrics(): Promise<string[]> {
  try {
    if (typeof navigator !== 'undefined' && 'product' in navigator && navigator.product === 'ReactNative') {
      const LocalAuthentication = await import('expo-local-authentication');
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map((type) => {
        switch (type) {
          case 1:
            return 'fingerprint';
          case 2:
            return 'facial_recognition';
          case 3:
            return 'iris';
          default:
            return 'unknown';
        }
      });
    }
    return [];
  } catch {
    return [];
  }
}

