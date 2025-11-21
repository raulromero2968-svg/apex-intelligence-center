/**
 * Minor Account Banner Component
 *
 * Displays a friendly, reassuring banner for users under 18 explaining
 * their permanent free tier access and account protections.
 */

'use client';

import { useState } from 'react';

interface MinorBannerProps {
  userName?: string | null;
}

export default function MinorBanner({ userName }: MinorBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const greeting = userName ? `Hey ${userName}!` : 'Hey there!';

  return (
    <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌟</span>
              <h2 className="text-xl font-bold">
                {greeting} Free forever. Growing up responsibly ❤️
              </h2>
            </div>

            <p className="text-white/90 mb-2">
              Your account has special protections because you're under 18. You
              have full access to all core features with our permanent free
              tier!
            </p>

            {isExpanded && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <h3 className="font-semibold mb-2">✅ What You Can Do:</h3>
                  <ul className="space-y-1 ml-4">
                    <li>• Access all free tier features (no limits!)</li>
                    <li>• Use TCG market intelligence tools</li>
                    <li>• View card forensics and analysis</li>
                    <li>• Track your collection</li>
                    <li>• Get price alerts</li>
                  </ul>
                </div>

                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <h3 className="font-semibold mb-2">
                    🛡️ Protected Features (for your safety):
                  </h3>
                  <ul className="space-y-1 ml-4">
                    <li>• Payment processing</li>
                    <li>• Subscription upgrades</li>
                    <li>• Wallet connections</li>
                    <li>• Token-gated content</li>
                  </ul>
                  <p className="mt-2 text-xs text-white/80">
                    These features will automatically unlock when you turn 18,
                    or your parent/guardian can request early access through our
                    support team.
                  </p>
                </div>

                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <h3 className="font-semibold mb-2">
                    💡 Questions or Need Help?
                  </h3>
                  <p className="text-sm">
                    Have a parent or guardian contact us at{' '}
                    <a
                      href="mailto:support@apex-intelligence.com"
                      className="underline hover:text-white"
                    >
                      support@apex-intelligence.com
                    </a>{' '}
                    for parental consent options.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 text-sm font-medium underline hover:text-white/90 transition-colors"
            >
              {isExpanded ? '▲ Show less' : '▼ Learn more'}
            </button>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Dismiss banner"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
