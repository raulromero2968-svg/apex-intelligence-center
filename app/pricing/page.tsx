import React from 'react';
import { Metadata } from 'next';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import Navigation from '@/components/Navigation';
import { PricingTiers } from '@/components/premium/PricingTiers';
import { Shield, Zap, Crown, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing - Apex Intelligence',
  description: 'Choose your intelligence level. Premium TCG market analysis and portfolio tracking starting at $29/month.',
  keywords: ['TCG', 'Pricing', 'Premium', 'Subscription', 'Market Analysis', 'Portfolio Tracker'],
  openGraph: {
    title: 'Pricing - Apex Intelligence',
    description: 'Upgrade your TCG market research with premium intelligence.',
    type: 'website',
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-gray-300 font-sans">
      <StarfieldBackground />
      <Navigation />

      <div className="relative pt-32 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-12 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-900/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-mono mb-6">
            <Zap size={16} />
            INTELLIGENCE TIERS
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 font-orbitron glow-text-cyan">
            Level Up Your Research
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            From casual collector to professional dealer, we have the intelligence tier for you.
          </p>
        </div>

        {/* Pricing Tiers */}
        <PricingTiers />

        {/* Trust Indicators */}
        <div className="max-w-5xl mx-auto px-4 mt-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900/50 rounded-full mb-4">
                <Shield className="text-cyan-400" size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-orbitron">
                Secure Payments
              </h3>
              <p className="text-sm text-gray-400">
                Encrypted checkout powered by Stripe. Your data is safe.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900/50 rounded-full mb-4">
                <Check className="text-cyan-400" size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-orbitron">
                14-Day Guarantee
              </h3>
              <p className="text-sm text-gray-400">
                Not satisfied? Full refund within 14 days. No questions asked.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900/50 rounded-full mb-4">
                <Crown className="text-cyan-400" size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-orbitron">
                Cancel Anytime
              </h3>
              <p className="text-sm text-gray-400">
                No long-term contracts. Cancel your subscription with one click.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto px-4 mt-20">
          <h2 className="text-3xl font-bold text-white text-center mb-10 font-orbitron">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">
                Can I switch plans later?
              </h3>
              <p className="text-gray-400 text-sm">
                Yes! You can upgrade or downgrade at any time. When upgrading, you'll be credited for unused time on your current plan. When downgrading, changes take effect at the end of your billing cycle.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-400 text-sm">
                We accept all major credit cards (Visa, Mastercard, Amex, Discover) through Stripe. We also support Apple Pay and Google Pay.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-400 text-sm">
                We don't offer traditional free trials, but we do offer a 14-day money-back guarantee. Sign up for any paid tier, and if you're not satisfied within 14 days, we'll issue a full refund.
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">
                What happens to my data if I cancel?
              </h3>
              <p className="text-gray-400 text-sm">
                Your portfolio data is preserved for 90 days after cancellation. You can reactivate anytime within that window and pick up where you left off. After 90 days, data is permanently deleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
