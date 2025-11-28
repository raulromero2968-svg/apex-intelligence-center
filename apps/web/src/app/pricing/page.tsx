'use client';

import Link from 'next/link';
import { Check, Zap, Crown, Rocket, ArrowRight, Shield } from 'lucide-react';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';

const tiers = [
  {
    name: 'FREE',
    tagline: 'Basic Access',
    price: '$0',
    period: 'forever',
    description: 'Get started with essential TCG market intelligence',
    features: [
      'Weekly market updates',
      'Basic price tracking',
      'Community access',
      'Email newsletters',
      'Public research archive',
    ],
    cta: 'Start Free',
    ctaLink: '/subscribe',
    icon: Shield,
    color: 'slate',
    gradient: 'from-slate-500 to-slate-700',
    borderColor: 'border-slate-500/30',
    glowColor: 'shadow-slate-500/10',
  },
  {
    name: 'PRO',
    tagline: 'Advanced Analytics',
    price: '$29',
    period: 'per month',
    description: 'Unlock professional-grade tools and insights',
    features: [
      'Everything in Free',
      'Daily market analysis',
      'Advanced price alerts',
      'Portfolio tracking',
      'Premium research reports',
      'API access',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    ctaLink: '/subscribe?tier=pro',
    icon: Zap,
    color: 'cyan',
    gradient: 'from-cyan-500 to-cyan-700',
    borderColor: 'border-cyan-500/30',
    glowColor: 'shadow-cyan-500/20',
    popular: true,
  },
  {
    name: 'ELITE',
    tagline: 'Institutional Grade',
    price: '$99',
    period: 'per month',
    description: 'Maximum intelligence for serious collectors',
    features: [
      'Everything in Pro',
      'Real-time market data',
      'Custom alerts & notifications',
      'Advanced portfolio analytics',
      'Exclusive market insights',
      'Direct analyst access',
      'White-label reports',
      'API priority access',
      'Dedicated account manager',
    ],
    cta: 'Go Elite',
    ctaLink: '/subscribe?tier=elite',
    icon: Crown,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-500/30',
    glowColor: 'shadow-purple-500/20',
  },
  {
    name: 'ENTERPRISE',
    tagline: 'Custom Solutions',
    price: 'Custom',
    period: 'contact us',
    description: 'Tailored solutions for organizations',
    features: [
      'Everything in Elite',
      'Custom integrations',
      'Dedicated infrastructure',
      'SLA guarantees',
      'On-premise deployment',
      'Custom training',
      'Unlimited API calls',
      'Multi-user accounts',
      'Custom analytics',
    ],
    cta: 'Contact Sales',
    ctaLink: 'https://apexomnis.io',
    icon: Rocket,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    borderColor: 'border-pink-500/30',
    glowColor: 'shadow-pink-500/20',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen relative pt-24 pb-20">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-scan-slow" />
      </div>

      <div className="container mx-auto px-4 md:px-12 relative z-10">
        {/* Header Section */}
        <section className="text-center mb-16 space-y-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            SUBSCRIPTION_TIERS // ACCESS_LEVELS
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)] mb-2">
              Choose Your
            </span>
            <span className="block">
              <span className="text-holographic drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                Access Level
              </span>
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            From casual collectors to institutional investors—unlock the intelligence you need to dominate the TCG market.
          </p>

          {/* Terminal Prompt */}
          <div className="font-mono text-sm text-cyan-400/60 max-w-2xl mx-auto text-left bg-slate-900/50 border border-cyan-500/20 rounded-lg p-4">
            <span className="text-purple-400">apex@pricing</span>
            <span className="text-slate-500">:</span>
            <span className="text-cyan-400">~</span>
            <span className="text-slate-500">$</span>
            <span className="ml-2 text-slate-400">./select_tier --upgrade</span>
            <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="mb-16">
          <ElectronicFolder 
            title="SUBSCRIPTION TIERS" 
            classification="PRICING // ACCESS_CONTROL"
          >
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 not-prose py-6">
              {tiers.map((tier) => {
                const Icon = tier.icon;
                return (
                  <div
                    key={tier.name}
                    className={`relative group overflow-hidden rounded-xl border ${tier.borderColor} bg-slate-900/50 backdrop-blur-sm p-8 hover:border-${tier.color}-400/60 hover:shadow-lg hover:${tier.glowColor} transition-all duration-300 flex flex-col ${
                      tier.popular ? 'ring-2 ring-cyan-400/50 scale-105' : ''
                    }`}
                  >
                    {/* Popular Badge */}
                    {tier.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg font-mono">
                        MOST POPULAR
                      </div>
                    )}

                    {/* Top accent line */}
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${tier.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg bg-${tier.color}-500/20 border border-${tier.color}-500/40 flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 text-${tier.color}-400`} />
                    </div>

                    {/* Tier Name */}
                    <h3 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${tier.gradient} mb-1`}>
                      {tier.name}
                    </h3>
                    <p className="text-sm text-slate-500 font-mono mb-4">{tier.tagline}</p>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">{tier.price}</span>
                        <span className="text-sm text-slate-500 font-mono">/ {tier.period}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                      {tier.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                          <Check className={`w-4 h-4 text-${tier.color}-400 flex-shrink-0 mt-0.5`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link
                      href={tier.ctaLink}
                      className={`group/btn inline-flex items-center justify-center gap-2 bg-gradient-to-r ${tier.gradient} hover:opacity-90 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl font-mono text-sm`}
                    >
                      [ {tier.cta.toUpperCase()} ]
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </ElectronicFolder>
        </section>

        {/* FAQ Section */}
        <section>
          <ElectronicFolder 
            title="FREQUENTLY ASKED QUESTIONS" 
            classification="SUPPORT // FAQ"
          >
            <div className="grid gap-6 md:grid-cols-2 not-prose">
              {[
                {
                  q: 'Can I upgrade or downgrade anytime?',
                  a: 'Yes, you can change your subscription tier at any time. Changes take effect immediately, and we prorate any billing differences.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, PayPal, and cryptocurrency payments for annual subscriptions.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'The Free tier gives you immediate access to basic features. Pro and Elite tiers include a 14-day money-back guarantee.',
                },
                {
                  q: 'Do you offer annual billing?',
                  a: 'Yes! Annual billing saves you 20% compared to monthly billing. Contact us for annual pricing details.',
                },
                {
                  q: 'What about API rate limits?',
                  a: 'Free: 100 calls/day, Pro: 10K calls/day, Elite: 100K calls/day, Enterprise: Unlimited with custom SLA.',
                },
                {
                  q: 'Can I cancel anytime?',
                  a: 'Absolutely. No contracts, no commitments. Cancel anytime from your account dashboard.',
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all"
                >
                  <h4 className="text-lg font-bold text-cyan-400 mb-3">{faq.q}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </ElectronicFolder>
        </section>

        {/* CTA Section */}
        <section className="mt-16 text-center">
          <div className="max-w-3xl mx-auto border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-xl p-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Still Have Questions?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Our team is here to help you choose the right tier for your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://apexomnis.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-4 rounded-lg transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] font-mono"
              >
                [ CONTACT_SALES ]
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-slate-900/50 hover:bg-slate-800/50 border border-cyan-500/30 hover:border-cyan-400/60 text-white font-medium px-8 py-4 rounded-lg transition-all backdrop-blur-sm font-mono"
              >
                [ BACK_TO_DASHBOARD ]
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
