/**
 * Apex Intelligence Mobile - Root Layout
 *
 * Features:
 * - Sentry performance tracing
 * - React Query setup
 * - Biometric auth guard
 * - First-launch biometric enrollment
 * - Offline-first data sync
 */

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { shouldPromptEnrollment, showEnrollmentPrompt } from '@/lib/biometric-enrollment';

// Initialize Sentry with optimized sampling
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  profilesSampleRate: __DEV__ ? 1.0 : 0.1,
  enableAutoPerformanceTracing: true,
  enableNativeCrashHandling: true,
  enableCaptureFailedRequests: true,

  // Smart sampling - 100% for critical paths, 10% for others
  tracesSampler: (samplingContext) => {
    const name = samplingContext.transactionContext.name;

    // Critical paths - always trace
    if (name.includes('watchlist') || name.includes('portfolio')) {
      return 1.0;
    }

    // Auth flows - high sampling
    if (name.includes('auth') || name.includes('login')) {
      return 0.8;
    }

    // Everything else - low sampling
    return 0.1;
  },

  // Filter noise
  beforeSend(event) {
    // Ignore ResizeObserver errors
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop')) {
      return null;
    }

    // Ignore network errors in dev
    if (__DEV__ && event.exception?.values?.[0]?.type === 'NetworkError') {
      return null;
    }

    return event;
  },

  integrations: [
    Sentry.reactNativeTracingIntegration({
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
  ],
});

// React Query client with offline support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'offlineFirst', // Use cache when offline
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 2,
    },
  },
});

function RootLayout() {
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);

  useEffect(() => {
    // Set user context for Sentry
    Sentry.setContext('device', {
      model: 'unknown', // Would be filled by device info
      os: 'unknown',
    });

    // Check if we should prompt for biometric enrollment on first launch
    const checkEnrollment = async () => {
      const shouldPrompt = await shouldPromptEnrollment();
      setEnrollmentChecked(true);

      if (shouldPrompt) {
        // Delay prompt slightly to let app finish loading
        setTimeout(() => {
          showEnrollmentPrompt(
            () => {
              // Success callback
              Sentry.addBreadcrumb({
                category: 'onboarding',
                message: 'Biometric enrollment completed on first launch',
                level: 'info',
              });
            },
            () => {
              // Skip callback
              Sentry.addBreadcrumb({
                category: 'onboarding',
                message: 'Biometric enrollment skipped',
                level: 'info',
              });
            }
          );
        }, 1000);
      }
    };

    checkEnrollment();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/security" options={{ presentation: 'card' }} />
      </Stack>
      <StatusBar style="light" />
    </QueryClientProvider>
  );
}

// Wrap with Sentry profiler
export default Sentry.wrap(RootLayout);
