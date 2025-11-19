/**
 * Biometric Authentication (Face ID / Touch ID)
 *
 * Features:
 * - Face ID on iOS
 * - Touch ID / Fingerprint on iOS/Android
 * - Fallback to device passcode
 * - Secure credential storage
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';

export interface BiometricCapabilities {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

/**
 * Check if biometric authentication is available
 */
export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      isAvailable: hasHardware && isEnrolled,
      hasHardware,
      isEnrolled,
      supportedTypes,
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
    };
  }
}

/**
 * Get human-readable biometric type
 */
export function getBiometricType(capabilities: BiometricCapabilities): string {
  if (!capabilities.isAvailable) return 'None';

  if (capabilities.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }

  if (capabilities.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Touch ID';
  }

  if (capabilities.supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris';
  }

  return 'Biometric';
}

/**
 * Authenticate user with biometrics
 */
export async function authenticateWithBiometrics(options?: {
  promptMessage?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
}): Promise<boolean> {
  const transaction = Sentry.startTransaction({
    name: 'mobile.auth.biometric',
    op: 'auth',
  });

  try {
    const capabilities = await getBiometricCapabilities();

    if (!capabilities.isAvailable) {
      throw new Error('Biometric authentication not available');
    }

    const biometricType = getBiometricType(capabilities);

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options?.promptMessage || `Authenticate with ${biometricType}`,
      cancelLabel: options?.cancelLabel || 'Cancel',
      disableDeviceFallback: options?.disableDeviceFallback || false,
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'Biometric authentication successful',
        level: 'info',
      });
      return true;
    }

    // Log failure reason
    if (result.error) {
      Sentry.addBreadcrumb({
        category: 'auth',
        message: `Biometric auth failed: ${result.error}`,
        level: 'warning',
      });
    }

    return false;
  } catch (error) {
    Sentry.captureException(error);
    console.error('Biometric authentication error:', error);
    return false;
  } finally {
    transaction.finish();
  }
}

/**
 * Store credentials securely
 */
export async function storeCredentials(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    Sentry.captureException(error);
    throw new Error('Failed to store credentials');
  }
}

/**
 * Retrieve credentials securely
 */
export async function getCredentials(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}

/**
 * Delete credentials
 */
export async function deleteCredentials(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    Sentry.captureException(error);
  }
}

/**
 * Authenticate and retrieve stored access token
 */
export async function authenticateAndGetToken(): Promise<string | null> {
  const authenticated = await authenticateWithBiometrics({
    promptMessage: 'Authenticate to access your portfolio',
  });

  if (!authenticated) {
    return null;
  }

  return await getCredentials('accessToken');
}

/**
 * Store access token after biometric auth
 */
export async function storeAccessToken(token: string): Promise<boolean> {
  const authenticated = await authenticateWithBiometrics({
    promptMessage: 'Authenticate to save credentials',
  });

  if (!authenticated) {
    return false;
  }

  await storeCredentials('accessToken', token);
  return true;
}

/**
 * Clear all stored credentials (logout)
 */
export async function clearAllCredentials(): Promise<void> {
  await Promise.all([
    deleteCredentials('accessToken'),
    deleteCredentials('refreshToken'),
    deleteCredentials('userId'),
  ]);
}
