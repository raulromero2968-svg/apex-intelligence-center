'use client';

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/lib/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track initial page view
    analytics.pageView(pathname);

    // Track time spent on page
    const stopTimeTracking = analytics.startTimeTracking();

    return () => {
      stopTimeTracking();
    };
  }, [pathname]);

  useEffect(() => {
    // Track page view on route change
    if (pathname) {
      analytics.pageView(pathname);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
