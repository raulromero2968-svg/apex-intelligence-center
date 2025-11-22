import '../global.css';
import * as Sentry from '@sentry/react-native';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Initialize Sentry
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  enableAutoPerformanceTracing: true,
  enableNativeCrashHandling: true,
  enableCaptureFailedRequests: true,
  // Optimization: Sample based on operation
  tracesSampler: (samplingContext) => {
    // 100% for critical paths
    if (samplingContext.transactionContext.name.includes('watchlist')) return 1.0;
    if (samplingContext.transactionContext.name.includes('portfolio')) return 1.0;
    // 10% for everything else
    return 0.1;
  },
  beforeSend: (event) => {
    // Filter out noise
    if (event.exception?.values?.[0]?.type === 'ResizeObserver loop') {
      return null;
    }
    return event;
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayout() {
  useEffect(() => {
    // Log app startup
    Sentry.addBreadcrumb({
      category: 'app',
      message: 'App started',
      level: 'info',
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
