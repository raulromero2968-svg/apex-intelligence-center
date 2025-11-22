/**
 * Security Settings Screen
 *
 * Features:
 * - Enable/disable biometric authentication
 * - View current biometric status
 * - Manage security preferences
 */

import { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import {
  getBiometricStatus,
  enableBiometricFromSettings,
  disableBiometrics,
} from '../../lib/biometric-enrollment';

export default function SecuritySettingsScreen() {
  const [biometricStatus, setBiometricStatus] = useState({
    enabled: false,
    available: false,
    type: 'Biometric',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBiometricStatus();
  }, []);

  const loadBiometricStatus = async () => {
    const transaction = Sentry.startTransaction({
      name: 'mobile.settings.security.load',
      op: 'screen.load',
    });

    try {
      const status = await getBiometricStatus();
      setBiometricStatus(status);
    } catch (error) {
      Sentry.captureException(error);
      console.error('Failed to load biometric status:', error);
    } finally {
      transaction.finish();
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (value) {
        // Enable biometric
        const success = await enableBiometricFromSettings();
        if (success) {
          setBiometricStatus({ ...biometricStatus, enabled: true });
          Alert.alert(
            'Success',
            `${biometricStatus.type} login has been enabled`
          );

          Sentry.addBreadcrumb({
            category: 'settings',
            message: 'Biometric authentication enabled',
            level: 'info',
          });
        }
      } else {
        // Disable biometric
        Alert.alert(
          'Disable Biometric Login?',
          `You will need to use your password to log in`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await disableBiometrics();
                setBiometricStatus({ ...biometricStatus, enabled: false });
                Alert.alert('Disabled', 'Biometric login has been disabled');

                Sentry.addBreadcrumb({
                  category: 'settings',
                  message: 'Biometric authentication disabled',
                  level: 'info',
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      Sentry.captureException(error);
      Alert.alert(
        'Error',
        'Failed to update biometric settings. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Security',
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biometric Authentication</Text>
          <Text style={styles.sectionDescription}>
            Use {biometricStatus.type} for quick and secure access to your portfolio
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{biometricStatus.type} Login</Text>
              <Text style={styles.settingSubtext}>
                {biometricStatus.available
                  ? biometricStatus.enabled
                    ? 'Enabled'
                    : 'Disabled'
                  : 'Not available on this device'}
              </Text>
            </View>
            <Switch
              value={biometricStatus.enabled}
              onValueChange={handleToggleBiometric}
              disabled={!biometricStatus.available || isLoading}
              trackColor={{ false: '#3a3a3a', true: '#10b981' }}
              thumbColor={biometricStatus.enabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {!biometricStatus.available && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {biometricStatus.type} is not set up on this device. Please enable it in your
                device settings first.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Information</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              • Your biometric data never leaves your device{'\n'}
              • Authentication is handled by your device's secure enclave{'\n'}
              • You can always use your password as a backup{'\n'}
              • Biometric login is reset if device hardware changes
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Privacy</Text>
            <Text style={styles.infoText}>
              Apex Intelligence does not store or have access to your biometric data. All
              biometric authentication is handled securely by your device's operating system.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Security</Text>

          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>Two-Factor Authentication</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>Active Sessions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: 13,
    color: '#888',
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#3a2a00',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
  },
  warningText: {
    fontSize: 13,
    color: '#fef3c7',
  },
  infoBox: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  settingButton: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
