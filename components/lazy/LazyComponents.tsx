'use client';

import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/ui/SkeletonLoader';

// Lazy load the IntelChart component with loading state
export const LazyIntelChart = dynamic(
  () => import('@/components/intel/IntelChart').then((mod) => ({ default: mod.IntelChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Disable SSR for charts (client-side only)
  }
);

// Lazy load framer-motion animations
export const LazyMotion = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  {
    loading: () => <div />,
    ssr: true,
  }
);
