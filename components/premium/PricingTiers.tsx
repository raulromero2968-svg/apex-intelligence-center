'use client';

import React from 'react';
import { Check, Zap, Crown, TrendingUp } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface Tier {
  name: string;
  price: string;
  priceMonthly: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  cta: string;
  highlighted?: boolean;
  comingSoon?: boolean;
}

export function PricingTiers() {
  const tiers: Tier[] = [
    {
      name: 'Free',
      price: '$0',
      priceMonthly: '$0',
      description: 'Get started with basic market intelligence',
      icon: <TrendingUp className="text-gray-400" size={24} />,
      features: [
        'Access to public articles',
        'Weekly market updates',
        'Basic portfolio tracker (up to 5 cards)',
        'Community Discord access',
      ],
      cta: 'Current Plan',
    },
    {
      name: 'Intelligence',
      price: '$29',
      priceMonthly: '$29/mo',
      description: 'Advanced analytics for serious collectors',
      icon: <Zap className="text-cyan-400" size={24} />,
      features: [
        'Everything in Free',
        'Exclusive market reports (2-3 per month)',
        'Premium portfolio tracker (unlimited)',
        'Price alerts & notifications',
        'Historical price data & charts',
        'Export portfolio to CSV',
        'Priority Discord support',
      ],
      cta: 'Upgrade to Intelligence',
      highlighted: true,
    },
    {
      name: 'Apex',
      price: '$99',
      priceMonthly: '$99/mo',
      description: 'The full intelligence suite for pros',
      icon: <Crown className="text-yellow-400" size={24} />,
      features: [
        'Everything in Intelligence',
        'Weekly deep-dive analysis calls',
        'Direct access to research team',
        'Custom market research requests',
        'API access for automated tracking',
        'Early access to new features',
        'Tax reporting & export tools',
      ],
      cta: 'Go Apex',
      comingSoon: true,
    },
  ];

  const handleUpgradeClick = (tierName: string) => {
    analytics.trackPremiumFlow('click_upgrade');
    analytics.track('pricing_tier_clicked', { tier: tierName });
    // In production, this would redirect to Stripe checkout or payment page
    console.log(`Upgrade to ${tierName} tier`);
  };

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-orbitron">
            Choose Your Intelligence Level
          </h2>
          <p className="text-xl text-gray-400">
            Upgrade your TCG market research. Cancel anytime.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 border backdrop-blur-sm transition-all ${
                tier.highlighted
                  ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.3)] scale-105'
                  : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Recommended Badge */}
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-600 text-black text-xs font-bold rounded-full font-mono">
                  MOST POPULAR
                </div>
              )}

              {/* Coming Soon Badge */}
              {tier.comingSoon && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-600 text-black text-xs font-bold rounded-full font-mono">
                  COMING SOON
                </div>
              )}

              {/* Icon */}
              <div className="mb-6">
                <div className={`inline-flex p-3 rounded-lg ${
                  tier.highlighted
                    ? 'bg-cyan-900/30'
                    : 'bg-gray-800/50'
                }`}>
                  {tier.icon}
                </div>
              </div>

              {/* Tier Name */}
              <h3 className="text-2xl font-bold text-white mb-2 font-orbitron">
                {tier.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-400 mb-6">
                {tier.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">
                    {tier.price}
                  </span>
                  {tier.price !== '$0' && (
                    <span className="ml-2 text-gray-500">/month</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <Check
                      className={`flex-shrink-0 mt-0.5 ${
                        tier.highlighted ? 'text-cyan-400' : 'text-gray-500'
                      }`}
                      size={16}
                    />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleUpgradeClick(tier.name)}
                disabled={tier.comingSoon || tier.price === '$0'}
                className={`w-full py-3 px-6 rounded-lg font-bold transition-all ${
                  tier.highlighted
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                    : tier.comingSoon
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : tier.price === '$0'
                    ? 'bg-gray-800 text-gray-400 cursor-default'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            All plans include 14-day money-back guarantee. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
