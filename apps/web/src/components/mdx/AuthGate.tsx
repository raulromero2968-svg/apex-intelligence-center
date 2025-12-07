/**
 * AuthGate Component
 *
 * Hides content from non-authenticated users - a direct conversion driver.
 * Creates "Fear Of Missing Out" (FOMO) that drives sign-ups.
 *
 * Usage in MDX:
 * ```mdx
 * Here's our analysis of the top 5 undervalued cards:
 *
 * 1. Card A - Visible to everyone
 * 2. Card B - Visible to everyone
 *
 * <AuthGate>
 *   3. **Hidden Gem C** - Only visible to logged-in users
 *   4. **Hidden Gem D** - Premium analysis
 *   5. **Hidden Gem E** - Exclusive pick
 * </AuthGate>
 * ```
 *
 * @see lib/mdx.ts for component registration
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Lock, LogIn, Crown, Sparkles, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

// ============================================================================
// Types
// ============================================================================

export interface AuthGateProps {
  /** Content to show/hide based on auth state */
  children: ReactNode;
  /** Gate type - determines messaging and styling */
  type?: 'free' | 'pro' | 'premium';
  /** Custom title for the gate */
  title?: string;
  /** Custom description */
  description?: string;
  /** Show blurred preview of content */
  showBlurredPreview?: boolean;
  /** Custom CTA text */
  ctaText?: string;
  /** Custom CTA href */
  ctaHref?: string;
}

// ============================================================================
// Gate Configurations
// ============================================================================

const gateConfig = {
  free: {
    title: 'Sign Up to Continue Reading',
    description: 'Create a free account to access this analysis and unlock the full article.',
    icon: LogIn,
    ctaText: 'Create Free Account',
    ctaHref: '/auth/signup',
    colors: 'from-cyan-500/20 to-purple-500/20 border-cyan-500/40',
    iconColor: 'text-cyan-400',
    buttonColor: 'bg-cyan-500 hover:bg-cyan-400',
  },
  pro: {
    title: 'Pro-Only Content',
    description: 'This premium analysis is available exclusively to Pro subscribers.',
    icon: Crown,
    ctaText: 'Upgrade to Pro',
    ctaHref: '/pricing',
    colors: 'from-purple-500/20 to-pink-500/20 border-purple-500/40',
    iconColor: 'text-purple-400',
    buttonColor: 'bg-purple-500 hover:bg-purple-400',
  },
  premium: {
    title: 'Premium Intelligence',
    description: 'Access our most valuable market insights with a Premium subscription.',
    icon: Sparkles,
    ctaText: 'Go Premium',
    ctaHref: '/pricing?tier=premium',
    colors: 'from-amber-500/20 to-orange-500/20 border-amber-500/40',
    iconColor: 'text-amber-400',
    buttonColor: 'bg-amber-500 hover:bg-amber-400',
  },
};

// ============================================================================
// Component
// ============================================================================

export function AuthGate({
  children,
  type = 'free',
  title,
  description,
  showBlurredPreview = true,
  ctaText,
  ctaHref,
}: AuthGateProps) {
  // TODO: Replace with actual auth hook
  // const { user, isLoading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate auth check - replace with real auth
  useEffect(() => {
    // Check for auth token (simplified check)
    const hasToken = typeof window !== 'undefined' &&
      (localStorage.getItem('apex-auth-token') ||
       document.cookie.includes('apex-session'));

    setIsAuthenticated(hasToken);
    setIsLoading(false);
  }, []);

  const config = gateConfig[type];
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayCtaText = ctaText || config.ctaText;
  const displayCtaHref = ctaHref || config.ctaHref;
  const Icon = config.icon;

  // Loading state
  if (isLoading) {
    return (
      <div className="my-8 rounded-xl border border-slate-700 bg-slate-900/50 p-8 animate-pulse">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Authenticated - show content
  if (isAuthenticated) {
    return (
      <div className="auth-gate-content">
        {children}
      </div>
    );
  }

  // Not authenticated - show gate
  return (
    <div className="my-8 relative">
      {/* Blurred Preview */}
      {showBlurredPreview && (
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50">
          {/* Blurred content preview */}
          <div
            className="p-6 blur-md select-none pointer-events-none opacity-50"
            aria-hidden="true"
          >
            {children}
          </div>

          {/* Gradient overlay */}
          <div
            className={clsx(
              'absolute inset-0 bg-gradient-to-b backdrop-blur-sm',
              config.colors
            )}
          />
        </div>
      )}

      {/* Gate Card */}
      <div
        className={clsx(
          'relative rounded-xl border p-8 backdrop-blur-md',
          'bg-gradient-to-br',
          config.colors,
          showBlurredPreview && '-mt-32 mx-4 shadow-2xl'
        )}
      >
        {/* Lock Icon */}
        <div className="flex justify-center mb-4">
          <div className={clsx(
            'w-16 h-16 rounded-full flex items-center justify-center',
            'bg-slate-900/50 border border-slate-700'
          )}>
            <Icon className={clsx('w-8 h-8', config.iconColor)} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white text-center mb-2">
          {displayTitle}
        </h3>

        {/* Description */}
        <p className="text-slate-400 text-center mb-6 max-w-md mx-auto">
          {displayDescription}
        </p>

        {/* What's Hidden Indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
          <EyeOff className="w-4 h-4" />
          <span>Content hidden from view</span>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Link
            href={displayCtaHref}
            className={clsx(
              'inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg',
              'text-black font-bold text-lg transition-all',
              'shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)]',
              config.buttonColor
            )}
          >
            <Lock className="w-5 h-5" />
            [ {displayCtaText.toUpperCase()} ]
          </Link>
        </div>

        {/* Already have account */}
        {type === 'free' && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-cyan-400 hover:text-cyan-300">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Convenience Exports
// ============================================================================

/** Gate for free tier (sign up required) */
export function SignUpGate(props: Omit<AuthGateProps, 'type'>) {
  return <AuthGate {...props} type="free" />;
}

/** Gate for Pro tier */
export function ProGate(props: Omit<AuthGateProps, 'type'>) {
  return <AuthGate {...props} type="pro" />;
}

/** Gate for Premium tier */
export function PremiumGate(props: Omit<AuthGateProps, 'type'>) {
  return <AuthGate {...props} type="premium" />;
}

export default AuthGate;
