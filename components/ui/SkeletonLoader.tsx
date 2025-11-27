import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'chart';
}

export function SkeletonLoader({ className = '', variant = 'rectangular' }: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gray-800/50';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    chart: 'h-64 rounded-lg',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-gray-800/50 rounded w-1/4"></div>
      <div className="h-64 bg-gray-800/50 rounded-lg flex items-end justify-around p-4 gap-2">
        {[60, 80, 40, 90, 50, 70, 85, 65].map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-700/50 rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 backdrop-blur-sm animate-pulse">
      <div className="h-6 bg-gray-800/50 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-800/50 rounded w-full"></div>
        <div className="h-4 bg-gray-800/50 rounded w-5/6"></div>
        <div className="h-4 bg-gray-800/50 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="h-5 bg-gray-800/50 rounded w-32 animate-pulse"></div>
      </div>
      <div className="divide-y divide-gray-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
            <div className="h-4 bg-gray-800/50 rounded flex-1"></div>
            <div className="h-4 bg-gray-800/50 rounded w-24"></div>
            <div className="h-4 bg-gray-800/50 rounded w-20"></div>
            <div className="h-4 bg-gray-800/50 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
