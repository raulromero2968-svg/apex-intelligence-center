'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Crown, TrendingUp, Zap } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface PaywallProps {
  variant?: 'soft' | 'hard';
  contentType?: 'article' | 'report' | 'portfolio' | 'feature';
  previewContent?: React.ReactNode;
  title?: string;
}

export function Paywall({
  variant = 'soft',
  contentType = 'article',
  previewContent,
  title = 'Premium Content',
}: PaywallProps) {
  const handleUpgradeClick = () => {
    analytics.trackPremiumFlow('click_upgrade');
    analytics.track('paywall_conversion_attempt', {
      variant,
      contentType,
    });
  };

  const benefits = {
    article: [
      'Full access to exclusive market analysis',
      'Data-driven investment insights',
      'Historical price charts & trends',
    ],
    report: [
      'Complete research reports',
      'Proprietary data & analysis',
      'Actionable trading signals',
    ],
    portfolio: [
      'Track unlimited cards',
      'Real-time price alerts',
      'Export & tax reporting',
    ],
    feature: [
      'Advanced platform features',
      'Priority support',
      'Early access to new tools',
    ],
  };

  if (variant === 'soft') {
    return (
      <div className="relative">
        {/* Preview Content with Fade */}
        {previewContent && (
          <div className="relative">
            <div className="max-h-[400px] overflow-hidden">
              {previewContent}
            </div>
            {/* Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent" />
          </div>
        )}

        {/* Paywall Card */}
        <div className="relative -mt-32 mx-auto max-w-2xl">
          <div className="bg-gray-900/95 backdrop-blur-md border border-yellow-600/50 rounded-2xl p-8 shadow-[0_0_40px_rgba(234,179,8,0.2)]">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-yellow-900/20 rounded-full">
                <Crown className="text-yellow-400" size={32} />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white text-center mb-3 font-orbitron">
              Unlock {title}
            </h3>

            <p className="text-gray-400 text-center mb-6">
              Get full access to this {contentType} and hundreds more with an Intelligence subscription.
            </p>

            {/* Benefits */}
            <ul className="space-y-3 mb-8">
              {benefits[contentType].map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                    <Zap className="text-yellow-400" size={12} />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Link
                href="/pricing"
                onClick={handleUpgradeClick}
                className="block w-full py-3 px-6 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg text-center transition-colors shadow-[0_0_20px_rgba(234,179,8,0.3)]"
              >
                Upgrade to Intelligence
              </Link>
              <Link
                href="/pricing"
                className="block w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg text-center transition-colors"
              >
                View All Plans
              </Link>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Starting at $29/month • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Hard paywall (no preview)
  return (
    <div className="min-h-[600px] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-gray-800 rounded-full">
            <Lock className="text-gray-400" size={32} />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white text-center mb-3 font-orbitron">
          Premium Feature
        </h3>

        <p className="text-gray-400 text-center mb-8">
          This {contentType} is only available to Intelligence and Apex subscribers.
        </p>

        {/* Tier Comparison */}
        <div className="space-y-3 mb-8">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-cyan-400" />
                Intelligence
              </span>
              <span className="text-cyan-400 font-bold">$29/mo</span>
            </div>
            <p className="text-xs text-gray-400">
              Full access to all {contentType}s + portfolio tracking
            </p>
          </div>

          <div className="p-4 bg-yellow-900/10 rounded-lg border border-yellow-600/30">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <Crown size={16} className="text-yellow-400" />
                Apex
              </span>
              <span className="text-yellow-400 font-bold">$99/mo</span>
            </div>
            <p className="text-xs text-gray-400">
              Everything + API access + research calls
            </p>
          </div>
        </div>

        <Link
          href="/pricing"
          onClick={handleUpgradeClick}
          className="block w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-center transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          Choose Your Plan
        </Link>
      </div>
    </div>
  );
}
