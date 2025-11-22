/**
 * Biometric Enrollment Flow
 *
 * Features:
 * - First-launch enrollment prompt
 * - Optional skip + enable later in Settings
 * - Force re-enrollment if hardware changes
 * - Hardware ID verification for security
 *
 * Flow used by Coinbase Wallet, Revolut, and Banking apps
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';
import { Alert, Platform } from 'react-native';

const ENROLLMENT_KEY = 'biometric_enrolled';
const HARDWARE_KEY = 'biometric_hardware_id';
const ENROLLMENT_SKIPPED_KEY = 'biometric_enrollment_skipped';

/**
 * Check if we should prompt for biometric enrollment
 */
export async function shouldPromptEnrollment(): Promise<boolean> {
  try {
    // Check if user previously skipped enrollment
    const skipped = await SecureStore.getItemAsync(ENROLLMENT_SKIPPED_KEY);
    if (skipped === 'true') {
      return false;
    }

    // Check if already enrolled
    const enrolled = await SecureStore.getItemAsync(ENROLLMENT_KEY);
    if (enrolled === 'true') {
      // Verify hardware hasn't changed (e.g., new phone, factory reset)
      const hasHardwareChanged = await checkHardwareChanged();
      if (hasHardwareChanged) {
        // Force re-enrollment if hardware changed
        await SecureStore.deleteItemAsync(ENROLLMENT_KEY);
        await SecureStore.deleteItemAsync(HARDWARE_KEY);
        Sentry.addBreadcrumb({
          category: 'biometric',
          message: 'Hardware changed, forcing re-enrollment',
          level: 'info',
        });
        return true;
      }
      return false;
    }

    // Check if biometric hardware is available
    const capabilities = await getBiometricCapabilities();
    return capabilities.isAvailable;
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
}

/**
 * Check if biometric hardware has changed
 */
async function checkHardwareChanged(): Promise<boolean> {
  try {
    const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const currentId = generateHardwareId(supported);
    const storedId = await SecureStore.getItemAsync(HARDWARE_KEY);

    if (!storedId) {
      return false;
    }

    return currentId !== storedId;
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
}

/**
 * Generate a unique hardware ID from supported authentication types
 */
function generateHardwareId(types: LocalAuthentication.AuthenticationType[]): string {
  return types.sort().join(',') + '_' + Platform.OS;
}

/**
 * Get biometric capabilities
 */
async function getBiometricCapabilities() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

  return {
    isAvailable: hasHardware && isEnrolled,
    hasHardware,
    isEnrolled,
    supportedTypes,
  };
}

/**
 * Get human-readable biometric type name
 */
function getBiometricTypeName(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris';
  }
  return 'Biometric';
}

/**
 * Complete enrollment and store hardware ID
 */
export async function completeEnrollment(): Promise<void> {
  try {
    const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const hardwareId = generateHardwareId(supported);

    await SecureStore.setItemAsync(ENROLLMENT_KEY, 'true');
    await SecureStore.setItemAsync(HARDWARE_KEY, hardwareId);
    await SecureStore.deleteItemAsync(ENROLLMENT_SKIPPED_KEY);

    Sentry.addBreadcrumb({
      category: 'biometric',
      message: 'Biometric enrollment completed',
      level: 'info',
    });
  } catch (error) {
    Sentry.captureException(error);
    throw new Error('Failed to complete enrollment');
  }
}

/**
 * Mark enrollment as skipped
 */
export async function skipEnrollment(): Promise<void> {
  try {
    await SecureStore.setItemAsync(ENROLLMENT_SKIPPED_KEY, 'true');

    Sentry.addBreadcrumb({
      category: 'biometric',
      message: 'Biometric enrollment skipped',
      level: 'info',
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}

/**
 * Disable biometric authentication
 */
export async function disableBiometrics(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ENROLLMENT_KEY);
    await SecureStore.deleteItemAsync(HARDWARE_KEY);

    Sentry.addBreadcrumb({
      category: 'biometric',
      message: 'Biometric authentication disabled',
      level: 'info',
    });
  } catch (error) {
    Sentry.captureException(error);
    throw new Error('Failed to disable biometrics');
  }
}

/**
 * Check if biometric authentication is currently enabled
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enrolled = await SecureStore.getItemAsync(ENROLLMENT_KEY);
    return enrolled === 'true';
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
}

/**
 * Show enrollment prompt (first launch experience)
 */
export async function showEnrollmentPrompt(onSuccess: () => void, onSkip?: () => void): Promise<void> {
  const transaction = Sentry.startTransaction({
    name: 'mobile.biometric.enrollment',
    op: 'enrollment',
  });

  try {
    const capabilities = await getBiometricCapabilities();

    if (!capabilities.isAvailable) {
      if (!capabilities.hasHardware) {
        Alert.alert(
          'Biometric Not Available',
          'Your device does not support biometric authentication.',
          [{ text: 'OK' }]
        );
      } else if (!capabilities.isEnrolled) {
        Alert.alert(
          'Set Up Biometrics',
          'Please set up Face ID or Touch ID in your device settings first.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    const biometricName = getBiometricTypeName(capabilities.supportedTypes);

    Alert.alert(
      `Enable ${biometricName}?`,
      `Use ${biometricName} for faster, secure access to your portfolio`,
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: async () => {
            await skipEnrollment();
            onSkip?.();
          }
        },
        {
          text: 'Enable',
          onPress: async () => {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: `Set up ${biometricName} login`,
              cancelLabel: 'Cancel',
              disableDeviceFallback: false,
              fallbackLabel: 'Use Passcode',
            });

            if (result.success) {
              await completeEnrollment();
              Alert.alert(
                'Success!',
                `${biometricName} login is now enabled`,
                [{ text: 'OK', onPress: onSuccess }]
              );
            } else {
              if (result.error === 'user_cancel') {
                await skipEnrollment();
                onSkip?.();
              }
            }
          }
        },
      ],
      { cancelable: false }
    );
  } catch (error) {
    Sentry.captureException(error);
    console.error('Enrollment prompt error:', error);
  } finally {
    transaction.finish();
  }
}

/**
 * Enable biometric authentication from settings
 */
export async function enableBiometricFromSettings(): Promise<boolean> {
  const transaction = Sentry.startTransaction({
    name: 'mobile.biometric.enable_settings',
    op: 'enrollment',
  });

  try {
    const capabilities = await getBiometricCapabilities();

    if (!capabilities.isAvailable) {
      if (!capabilities.hasHardware) {
        Alert.alert(
          'Not Supported',
          'Your device does not support biometric authentication.'
        );
      } else {
        Alert.alert(
          'Set Up Required',
          'Please set up Face ID or Touch ID in your device settings first.'
        );
      }
      return false;
    }

    const biometricName = getBiometricTypeName(capabilities.supportedTypes);

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Enable ${biometricName} login`,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      await completeEnrollment();
      return true;
    }

    return false;
  } catch (error) {
    Sentry.captureException(error);
    console.error('Enable biometric error:', error);
    return false;
  } finally {
    transaction.finish();
  }
}

/**
 * Get current biometric status for display in settings
 */
export async function getBiometricStatus(): Promise<{
  enabled: boolean;
  available: boolean;
  type: string;
}> {
  try {
    const enabled = await isBiometricEnabled();
    const capabilities = await getBiometricCapabilities();
    const type = getBiometricTypeName(capabilities.supportedTypes);

    return {
      enabled,
      available: capabilities.isAvailable,
      type,
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      enabled: false,
      available: false,
      type: 'Biometric',
    };
  }
}
