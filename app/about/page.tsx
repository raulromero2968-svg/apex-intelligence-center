'use client'

import { motion } from 'framer-motion'
import { Target, Users, Shield, Zap, Brain, Lock, TrendingUp, Database } from 'lucide-react'
import Link from 'next/link'
import { StarfieldBackground } from '@/components/layout/StarfieldBackground'
import Navigation from '@/components/Navigation'

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Data-Driven',
      description: 'Every insight backed by real market data and analysis'
    },
    {
      icon: Shield,
      title: 'Transparent',
      description: 'No hidden agendas, just honest market intelligence'
    },
    {
      icon: Zap,
      title: 'Actionable',
      description: 'Intelligence you can actually use to make decisions'
    },
    {
      icon: Users,
      title: 'Community-First',
      description: 'Built for collectors, by collectors'
    }
  ]

  const capabilities = [
    {
      icon: Brain,
      title: 'Market Analysis',
      items: ['Price trends & movements', 'Set performance tracking', 'Investment opportunities', 'Market sentiment analysis']
    },
    {
      icon: Database,
      title: 'Data & Research',
      items: ['Historical price data', 'Graded vs raw analysis', 'Regional market comparison', 'Rarity & print run intel']
    },
    {
      icon: TrendingUp,
      title: 'Investment Strategy',
      items: ['Portfolio diversification', 'Timing strategies', 'Risk management', 'Long-term value plays']
    },
    {
      icon: Lock,
      title: 'Underground Intel',
      items: ['Collector insights', 'Market predictions', 'Alpha opportunities', 'Industry news & updates']
    }
  ]

  return (
    <main className="min-h-screen text-gray-300 font-sans relative z-10">
      <StarfieldBackground />
      <Navigation />

      <div className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <div className="mb-4">
            <span className="text-cyan-500 font-mono text-xs tracking-widest">CLASSIFIED // ABOUT</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-orbitron mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              Underground Intel,
            </span>
            <br />
            <span className="text-white glow-text-cyan">Surface-Level Access</span>
          </h1>

          <p className="text-xl text-gray-400 leading-relaxed">
            Apex Intelligence is where Morning Brew meets the cyberpunk underground—delivering
            premium TCG market intelligence to serious collectors and investors who refuse to rely on guesswork.
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-xl p-12 mb-20 bg-gray-900/40 border border-gray-800 backdrop-blur-md overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5" />

          <div className="relative max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-orbitron mb-6 text-center text-white glow-text-cyan">
              The Mission
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              The TCG market is a multi-billion dollar industry, but most collectors are flying blind.
              Price data is scattered. Analysis is shallow. Intelligence is locked behind Discord paywalls.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              We're building the intel network that should have existed years ago: a place where serious
              collectors can get data-driven insights, market analysis, and actionable intelligence—without
              the noise, without the hype, without the BS.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed">
              Think Morning Brew's snackable format meets Gaia Online's community vibe, powered by real
              market data and built for people who actually collect, not just speculate.
            </p>
          </div>
        </motion.div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold font-orbitron text-center mb-12 text-white glow-text-cyan">
            What We Stand For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-center group hover:border-cyan-500/30 transition-all backdrop-blur-sm"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center transition-shadow">
                  <value.icon className="text-cyan-400" size={28} />
                </div>
                <h3 className="text-xl font-bold font-orbitron mb-2 text-white">
                  {value.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* What We Cover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold font-orbitron text-center mb-12 text-white glow-text-cyan">
            Intelligence Coverage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capabilities.map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 backdrop-blur-sm hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-900/20 rounded-lg">
                    <capability.icon className="text-cyan-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold font-orbitron text-white">
                    {capability.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {capability.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-gray-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Human Impulse & System Safety */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold font-orbitron text-center mb-8 text-white glow-text-cyan">
            Our Approach
          </h2>
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-8 backdrop-blur-sm">
            <h3 className="text-xl font-bold font-orbitron mb-4 text-cyan-400">
              Human Impulse & System Safety
            </h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              At Apex Intelligence, we assume people arrive with all kinds of impulses—toward themselves and toward others,
              generous and destructive, hopeful and furious. Our job is not to judge you for having those thoughts, but to
              ensure our tools never turn a passing urge into a permanent wound.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              We design our systems so they never encourage or instruct self-harm or harm to others. Wherever we brush up
              against crisis, we aim to redirect that energy toward support, reflection, and creation.
            </p>
            <p className="text-gray-300 leading-relaxed">
              In everything we build, we aim to be a lens and a guide, never a weapon.
            </p>
          </div>
        </motion.div>

        {/* Origin Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold font-orbitron text-center mb-8 text-white glow-text-cyan">
            Who's Behind This?
          </h2>
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-8 backdrop-blur-sm">
            <p className="text-gray-300 leading-relaxed mb-4">
              Started by collectors who got tired of making investment decisions based on Reddit speculation
              and YouTube hype. We wanted real data, real analysis, and a community that actually cared about
              the fundamentals.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              After years of tracking our own collections, building spreadsheets, and analyzing market trends,
              we realized others needed this intelligence too. So we built Apex Intelligence—the intel network
              we wished existed when we started collecting.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Now we're sharing our research, data, and insights with collectors who refuse to
              leave money on the table.
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold font-orbitron mb-6 text-white glow-text-cyan">
            Ready to Level Up?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join the network and start making data-driven decisions for your collection.
          </p>
          <Link
            href="/intel"
            className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            Browse Intelligence Reports
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
