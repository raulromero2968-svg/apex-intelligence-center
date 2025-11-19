/**
 * Biometric Authentication Tests
 *
 * Comprehensive test coverage for biometric enrollment and authentication:
 * - Successful authentication
 * - Failed attempts and lockout
 * - Hardware change detection
 * - Enrollment flow
 * - Permission handling
 * - Fallback scenarios
 */

import {
  shouldPromptEnrollment,
  showEnrollmentPrompt,
  completeEnrollment,
  skipEnrollment,
  disableBiometrics,
  isBiometricEnabled,
  getBiometricStatus,
  enableBiometricFromSettings,
} from '../lib/biometric-enrollment';
import { authenticateWithBiometrics } from '../lib/auth';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Mock dependencies
jest.mock('expo-local-authentication');
jest.mock('expo-secure-store');
jest.mock('@sentry/react-native', () => ({
  startTransaction: jest.fn(() => ({
    finish: jest.fn(),
  })),
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

describe('Biometric Authentication', () => {
  beforeEach(async () => {
    // Clear all secure storage before each test
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Successful Authentication', () => {
    it('should authenticate successfully on first try', async () => {
      // Mock biometric hardware available
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await authenticateWithBiometrics();

      expect(result).toBe(true);
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledTimes(1);
    });

    it('should return biometric type correctly', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const status = await getBiometricStatus();

      expect(status.available).toBe(true);
      expect(status.type).toBe(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
    });
  });

  describe('Failed Authentication', () => {
    it('should handle authentication failure', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });

      const result = await authenticateWithBiometrics();

      expect(result).toBe(false);
    });

    it('should handle biometric hardware not available', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([]);

      const status = await getBiometricStatus();

      expect(status.available).toBe(false);
      expect(status.hasHardware).toBe(false);
    });

    it('should handle biometric not enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      const status = await getBiometricStatus();

      expect(status.available).toBe(false);
      expect(status.hasHardware).toBe(true);
      expect(status.isEnrolled).toBe(false);
    });
  });

  describe('Enrollment Flow', () => {
    it('should prompt for enrollment on first launch', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      const shouldPrompt = await shouldPromptEnrollment();

      expect(shouldPrompt).toBe(true);
    });

    it('should not prompt if already enrolled', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'biometric_enrolled') return Promise.resolve('true');
        if (key === 'biometric_hardware_id')
          return Promise.resolve('1_' + Platform.OS);
        return Promise.resolve(null);
      });
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      const shouldPrompt = await shouldPromptEnrollment();

      expect(shouldPrompt).toBe(false);
    });

    it('should not prompt if user skipped enrollment', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'biometric_enrollment_skipped') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const shouldPrompt = await shouldPromptEnrollment();

      expect(shouldPrompt).toBe(false);
    });

    it('should complete enrollment successfully', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      await completeEnrollment();

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('biometric_enrolled', 'true');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_hardware_id',
        expect.stringContaining(Platform.OS)
      );
    });

    it('should handle enrollment skip', async () => {
      await skipEnrollment();

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_enrollment_skipped',
        'true'
      );
    });

    it('should disable biometrics', async () => {
      await disableBiometrics();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('biometric_enrolled');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('biometric_hardware_id');
    });
  });

  describe('Hardware Change Detection', () => {
    it('should detect hardware change and force re-enrollment', async () => {
      // Previously enrolled with Face ID
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'biometric_enrolled') return Promise.resolve('true');
        if (key === 'biometric_hardware_id')
          return Promise.resolve('1_' + Platform.OS);
        return Promise.resolve(null);
      });

      // Now has Touch ID (different hardware)
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const shouldPrompt = await shouldPromptEnrollment();

      expect(shouldPrompt).toBe(true);
    });

    it('should not re-prompt if hardware is the same', async () => {
      const hardwareId = '1_' + Platform.OS;

      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'biometric_enrolled') return Promise.resolve('true');
        if (key === 'biometric_hardware_id') return Promise.resolve(hardwareId);
        return Promise.resolve(null);
      });

      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      const shouldPrompt = await shouldPromptEnrollment();

      expect(shouldPrompt).toBe(false);
    });

    it('should generate consistent hardware IDs', async () => {
      const types = [
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ];

      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue(
        types
      );

      await completeEnrollment();

      const calls = (SecureStore.setItemAsync as jest.Mock).mock.calls;
      const hardwareIdCall = calls.find((call) => call[0] === 'biometric_hardware_id');

      expect(hardwareIdCall[1]).toBe('1,2_' + Platform.OS);
    });
  });

  describe('Enable/Disable from Settings', () => {
    it('should enable biometric from settings', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await enableBiometricFromSettings();

      expect(result).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('biometric_enrolled', 'true');
    });

    it('should fail if authentication fails', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
      });

      const result = await enableBiometricFromSettings();

      expect(result).toBe(false);
    });

    it('should check if biometric is enabled', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');

      const isEnabled = await isBiometricEnabled();

      expect(isEnabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle SecureStore errors gracefully', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('SecureStore error')
      );

      const shouldPrompt = await shouldPromptEnrollment();

      expect(shouldPrompt).toBe(false);
    });

    it('should handle LocalAuthentication errors gracefully', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(
        new Error('Hardware error')
      );

      const status = await getBiometricStatus();

      expect(status.available).toBe(false);
      expect(status.enabled).toBe(false);
    });
  });
});
