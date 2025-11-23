'use client'

import Link from 'next/link'
import { ArrowRight, TrendingUp, BarChart3, Users, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { WolfConstellation } from '@/components/hero/WolfConstellation'

export default function Home() {
  const features = [
    {
      icon: TrendingUp,
      title: 'Market Intelligence',
      description: 'Real-time TCG market data and trend analysis'
    },
    {
      icon: BarChart3,
      title: 'Price Tracking',
      description: 'Track card values and identify investment opportunities'
    },
    {
      icon: Users,
      title: 'Community Intel',
      description: 'Insights from serious collectors and investors'
    },
    {
      icon: Shield,
      title: 'Alpha Access',
      description: 'Get the edge with exclusive market intelligence'
    }
  ]

  const featuredIntel = [
    {
      title: 'Q4 2024 Market Analysis',
      excerpt: 'Deep dive into TCG market trends, top movers, and investment opportunities for serious collectors...',
      date: 'Oct 25, 2024',
      readTime: '8 min read',
      category: 'Market Analysis'
    },
    {
      title: 'Pokemon 151: Value Trajectory',
      excerpt: 'Comprehensive analysis of Pokemon 151 set performance, chase cards, and long-term investment potential...',
      date: 'Oct 20, 2024',
      readTime: '6 min read',
      category: 'Set Analysis'
    },
    {
      title: 'Graded vs Raw: 2024 Edition',
      excerpt: 'Updated analysis on graded vs raw card values, grading costs, and ROI calculations for modern sets...',
      date: 'Oct 15, 2024',
      readTime: '10 min read',
      category: 'Investment Guide'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center py-20 overflow-hidden">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <div className="inline-block mb-6 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30">
                <span className="text-neon-cyan text-sm font-semibold flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
                  </span>
                  TCG INTELLIGENCE NETWORK ONLINE
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-orbitron)] mb-6">
                <span className="text-glow-cyan">Underground Intel</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                  For Serious Collectors
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                Premium TCG market analysis, data-driven insights, and exclusive intelligence.
                Morning Brew meets the underground—delivered to your inbox.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-4">
                <Link href="/subscribe" className="btn-primary inline-flex items-center">
                  Get Free Intel
                  <ArrowRight className="ml-2" size={20} />
                </Link>
                <Link href="/intel" className="btn-secondary inline-flex items-center">
                  Browse Archives
                </Link>
              </div>

              {/* Social Proof */}
              <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-400">
                <div>
                  <span className="text-2xl font-bold text-neon-cyan text-glow-cyan">1.2K+</span>
                  <br />Collectors
                </div>
                <div className="h-8 w-px bg-neon-cyan/30" />
                <div>
                  <span className="text-2xl font-bold text-neon-cyan text-glow-cyan">50+</span>
                  <br />Intel Drops
                </div>
                <div className="h-8 w-px bg-neon-cyan/30" />
                <div>
                  <span className="text-2xl font-bold text-neon-cyan text-glow-cyan">$2M+</span>
                  <br />Cards Tracked
                </div>
              </div>
            </motion.div>

            {/* Right Column - Wolf Constellation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex items-center justify-center"
            >
              <WolfConstellation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-y border-neon-cyan/20">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card-cyber group hover:scale-105 transition-transform duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center mb-4 group-hover:shadow-neon-cyan transition-shadow">
                  <feature.icon className="text-neon-cyan" size={24} />
                </div>
                <h3 className="text-lg font-bold font-[family-name:var(--font-orbitron)] mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Intel Drops */}
      <section className="py-20">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] text-glow-cyan mb-2">
                Latest Intel
              </h2>
              <p className="text-gray-400">Free samples from the vault</p>
            </div>
            <Link href="/intel" className="text-neon-cyan hover:text-neon-pink transition-colors flex items-center">
              View All
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredIntel.map((intel, index) => (
              <motion.article
                key={intel.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card-cyber group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-neon-pink">{intel.category}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">{intel.readTime}</span>
                </div>
                
                <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)] mb-3 group-hover:text-neon-cyan transition-colors">
                  {intel.title}
                </h3>
                
                <p className="text-gray-400 text-sm mb-4">
                  {intel.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{intel.date}</span>
                  <ArrowRight className="text-neon-cyan group-hover:translate-x-2 transition-transform" size={16} />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-neon-cyan/20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl p-12 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/10 backdrop-blur-xl" />
            <div className="absolute inset-0 neon-border" />
            
            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] mb-4 text-glow-cyan">
                Ready for Alpha?
              </h2>
              <p className="text-gray-300 mb-8">
                Join 1,200+ serious collectors getting exclusive TCG market intelligence delivered weekly.
              </p>
              <Link href="/subscribe" className="btn-primary inline-flex items-center">
                Subscribe Now
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
