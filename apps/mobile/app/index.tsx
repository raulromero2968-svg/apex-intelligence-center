import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { authenticateBiometric, isBiometricAvailable } from '@apex/auth';
import { useRouter } from 'expo-router';
import * as Sentry from '@sentry/react-native';

export default function Index() {
  const router = useRouter();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  async function checkBiometricAvailability() {
    const transaction = Sentry.startTransaction({ name: 'check-biometric-availability' });
    try {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error checking biometric availability:', error);
    } finally {
      transaction.finish();
    }
  }

  async function handleBiometricAuth() {
    const transaction = Sentry.startTransaction({ name: 'biometric-auth' });
    setIsAuthenticating(true);

    try {
      const result = await authenticateBiometric({
        promptMessage: 'Authenticate to access Apex Intelligence',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        Sentry.addBreadcrumb({
          category: 'auth',
          message: 'Biometric auth successful',
          level: 'info',
        });
        // Navigate to home screen
        router.push('/home');
      } else if (result.locked) {
        Alert.alert(
          'Account Locked',
          result.error || 'Too many failed attempts',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Please try again',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Sentry.captureException(error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsAuthenticating(false);
      transaction.finish();
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-4xl font-bold text-foreground mb-2">
        Apex Intelligence
      </Text>
      <Text className="text-lg text-muted-foreground mb-8 text-center">
        TCG Market Intelligence Platform
      </Text>

      {biometricAvailable ? (
        <TouchableOpacity
          onPress={handleBiometricAuth}
          disabled={isAuthenticating}
          className="bg-primary px-8 py-4 rounded-lg mb-4"
          activeOpacity={0.8}
        >
          <Text className="text-primary-foreground font-semibold text-lg">
            {isAuthenticating ? 'Authenticating...' : 'Unlock with Biometrics'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/home')}
          className="bg-primary px-8 py-4 rounded-lg mb-4"
          activeOpacity={0.8}
        >
          <Text className="text-primary-foreground font-semibold text-lg">
            Continue
          </Text>
        </TouchableOpacity>
      )}

      <Text className="text-sm text-muted-foreground mt-4">
        {biometricAvailable ? 'Biometric authentication enabled' : 'Biometric not available on this device'}
      </Text>
    </View>
  );
}
