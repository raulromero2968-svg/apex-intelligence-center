'use client'

import { Check, Mail, TrendingUp, BarChart3, Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function SubscribePage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Add your Substack or newsletter integration here
    setTimeout(() => {
      setIsSubmitting(false)
      alert('Thanks for subscribing! Check your email to confirm.')
      setEmail('')
    }, 1000)
  }

  const benefits = [
    'Weekly TCG market analysis and insights',
    'Exclusive data on trending cards and sets',
    'Early access to investment opportunities',
    'Community intel from serious collectors',
    'Market alerts and price movement notifications',
    'Deep-dive reports on specific TCG segments'
  ]

  const tiers = [
    {
      name: 'Free Intel',
      price: '$0',
      period: '/month',
      description: 'Get started with essential market intelligence',
      features: [
        'Weekly newsletter',
        'Market overview & trends',
        'Top 10 movers analysis',
        'Community access',
        'Archive access'
      ],
      cta: 'Start Free',
      highlight: false
    },
    {
      name: 'Premium',
      price: '$12',
      period: '/month',
      description: 'For serious collectors and investors',
      features: [
        'Everything in Free',
        'Daily market alerts',
        'Deep-dive set analysis',
        'Investment recommendations',
        'Price tracking tools',
        'Discord community access',
        'Early access to research'
      ],
      cta: 'Go Premium',
      highlight: true
    },
    {
      name: 'Alpha',
      price: '$25',
      period: '/month',
      description: 'Maximum edge for professional collectors',
      features: [
        'Everything in Premium',
        'Real-time market data',
        'Custom portfolio tracking',
        '1-on-1 consultation (monthly)',
        'Exclusive alpha intel',
        'API access to data',
        'Priority support'
      ],
      cta: 'Get Alpha Access',
      highlight: false
    }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-neon-pink/10 border border-neon-pink/30">
            <span className="text-neon-pink text-sm font-semibold">LIMITED BETA ACCESS</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-orbitron)] mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink">
              Join the Intel Network
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-8">
            Get premium TCG market intelligence delivered to your inbox. 
            Start with free access, upgrade when you're ready for alpha.
          </p>
        </motion.div>

        {/* Email Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto mb-20"
        >
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neon-cyan" size={20} />
              <input
                type="email"
                placeholder="Enter your email for free intel..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-32 py-4 bg-cyber-dark/50 border border-neon-cyan/30 rounded-lg
                         text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none
                         focus:shadow-neon-cyan transition-all backdrop-blur-md"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary py-2 px-6"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Join 1,200+ collectors • No spam, unsubscribe anytime
            </p>
          </form>

          {/* Replace with your Substack embed code when ready */}
          <div className="mt-8 p-6 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg">
            <p className="text-sm text-gray-400 text-center">
              💡 <strong>Ready to integrate:</strong> Replace the form above with your Substack embed code
            </p>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] text-center mb-12 text-glow-cyan">
            What You Get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start gap-3 p-4 bg-cyber-dark/30 rounded-lg border border-neon-cyan/20"
              >
                <Check className="text-neon-cyan flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-300">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-center mb-4 text-glow-cyan">
            Choose Your Access Level
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Start free, upgrade anytime for deeper intelligence
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl p-8 ${
                  tier.highlight
                    ? 'bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/10 border-2 border-neon-cyan scale-105'
                    : 'bg-cyber-dark/50 border border-neon-cyan/20'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-neon-cyan text-cyber-dark text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-neon-cyan">{tier.price}</span>
                    <span className="text-gray-400 ml-2">{tier.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="text-neon-cyan flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                    tier.highlight
                      ? 'btn-primary'
                      : 'bg-cyber-dark border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10'
                  }`}
                >
                  {tier.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h3 className="text-2xl font-bold font-[family-name:var(--font-orbitron)] mb-8">
            Trusted by Serious Collectors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote: "The best TCG market intel I've found. Data-driven, no BS, just alpha.",
                author: "Alex M.",
                role: "6-Figure Collector"
              },
              {
                quote: "Apex Intelligence helped me 3x my collection value in 6 months.",
                author: "Sarah K.",
                role: "Pokemon Investor"
              },
              {
                quote: "Finally, someone who understands the market and delivers real value.",
                author: "Mike R.",
                role: "MTG Dealer"
              }
            ].map((testimonial, index) => (
              <div key={index} className="card-cyber">
                <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-neon-cyan">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
