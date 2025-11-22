'use client'

import { motion } from 'framer-motion'
import { Target, TrendingUp, Users, Shield, BarChart3, Zap } from 'lucide-react'
import Link from 'next/link'

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

  const stats = [
    { label: 'Collectors', value: '1,200+' },
    { label: 'Intel Drops', value: '50+' },
    { label: 'Cards Tracked', value: '$2M+' },
    { label: 'Markets Analyzed', value: '10+' }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-orbitron)] mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink">
              Underground Intel,
            </span>
            <br />
            <span className="text-glow-cyan">Surface-Level Access</span>
          </h1>
          
          <p className="text-xl text-gray-400 leading-relaxed">
            Apex Intelligence is where Morning Brew meets the cyberpunk underground—delivering 
            premium TCG market intelligence to serious collectors and investors who refuse to rely on guesswork.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] text-neon-cyan text-glow-cyan mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl p-12 mb-20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/10 backdrop-blur-xl" />
          <div className="absolute inset-0 neon-border" />
          
          <div className="relative max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] mb-6 text-center text-glow-cyan">
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
          <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-center mb-12 text-glow-cyan">
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
                className="card-cyber text-center group hover:scale-105 transition-transform"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center group-hover:shadow-neon-cyan transition-shadow">
                  <value.icon className="text-neon-cyan" size={28} />
                </div>
                <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)] mb-2">
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
          <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-center mb-12 text-glow-cyan">
            What We Cover
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: 'Market Analysis',
                items: ['Price trends & movements', 'Set performance tracking', 'Investment opportunities', 'Market sentiment analysis']
              },
              {
                title: 'Data & Research',
                items: ['Historical price data', 'Graded vs raw analysis', 'Regional market comparison', 'Rarity & print run intel']
              },
              {
                title: 'Investment Strategy',
                items: ['Portfolio diversification', 'Timing strategies', 'Risk management', 'Long-term value plays']
              },
              {
                title: 'Community Intelligence',
                items: ['Collector insights', 'Market predictions', 'Alpha opportunities', 'Industry news & updates']
              }
            ].map((section, index) => (
              <div key={section.title} className="card-cyber">
                <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)] mb-4 text-neon-cyan">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Founder Story (Placeholder) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-center mb-8 text-glow-cyan">
            Who's Behind This?
          </h2>
          <div className="card-cyber">
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
              Now we're sharing our research, data, and insights with thousands of collectors who refuse to 
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
          <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] mb-6 text-glow-cyan">
            Ready to Level Up?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join the network and start making data-driven decisions for your collection.
          </p>
          <Link href="/subscribe" className="btn-primary inline-block">
            Get Free Intel
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
