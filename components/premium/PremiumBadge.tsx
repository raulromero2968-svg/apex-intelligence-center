'use client';

import React from 'react';
import { Crown, Lock } from 'lucide-react';

interface PremiumBadgeProps {
  variant?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  text?: string;
  className?: string;
}

export function PremiumBadge({
  variant = 'medium',
  showIcon = true,
  text = 'PREMIUM',
  className = ''
}: PremiumBadgeProps) {
  const sizes = {
    small: 'px-2 py-0.5 text-[10px]',
    medium: 'px-3 py-1 text-xs',
    large: 'px-4 py-1.5 text-sm',
  };

  const iconSizes = {
    small: 10,
    medium: 12,
    large: 14,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded font-mono ${sizes[variant]} ${className}`}
    >
      {showIcon && <Crown size={iconSizes[variant]} />}
      {text}
    </span>
  );
}

interface LockedBadgeProps {
  variant?: 'small' | 'medium' | 'large';
  className?: string;
}

export function LockedBadge({ variant = 'medium', className = '' }: LockedBadgeProps) {
  const sizes = {
    small: 'px-2 py-0.5 text-[10px]',
    medium: 'px-3 py-1 text-xs',
    large: 'px-4 py-1.5 text-sm',
  };

  const iconSizes = {
    small: 10,
    medium: 12,
    large: 14,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-gray-800 border border-gray-700 text-gray-400 font-bold rounded font-mono ${sizes[variant]} ${className}`}
    >
      <Lock size={iconSizes[variant]} />
      LOCKED
    </span>
  );
}
