'use client'

import { motion } from 'framer-motion'
import { Heart, Users, Eye, Shield } from 'lucide-react'
import Link from 'next/link'
import { StarfieldBackground } from '@/components/layout/StarfieldBackground'
import Navigation from '@/components/Navigation'

export default function CommonsPage() {
  const principles = [
    {
      icon: Heart,
      title: 'Celebrate the Work',
      description: 'We honor people who use their power to create positive change'
    },
    {
      icon: Eye,
      title: 'Stay Clear-Eyed',
      description: 'Even heroes are human, with limits and complexities we must acknowledge'
    },
    {
      icon: Users,
      title: 'Remember the Many',
      description: 'Behind every famous face are invisible systems and workers who make it possible'
    },
    {
      icon: Shield,
      title: 'Keep Your Agency',
      description: 'No leader is your conscience—learn from them while maintaining your own moral compass'
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
            <span className="text-cyan-500 font-mono text-xs tracking-widest">APEX COMMONS // COMMUNITY</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-orbitron mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              A Community Built on
            </span>
            <br />
            <span className="text-white glow-text-cyan">Gratitude, Not Idolatry</span>
          </h1>

          <p className="text-xl text-gray-400 leading-relaxed">
            Apex Commons is our vision for a community where good work is celebrated,
            complexity is acknowledged, and no one has to be a god for good things to happen.
          </p>
        </motion.div>

        {/* Note on Heroes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-xl p-12 mb-20 bg-gray-900/40 border border-gray-800 backdrop-blur-md overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5" />

          <div className="relative max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-orbitron mb-6 text-center text-white glow-text-cyan">
              A Note on Heroes
            </h2>

            <div className="text-center mb-8">
              <p className="text-2xl font-bold text-cyan-400 mb-2">
                Admire the work. Don't worship the person.
              </p>
            </div>

            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              At Apex Commons, we are honest about a simple human truth: we love heroes. We look for avatars
              of our values—singers, founders, activists—and we put them on pedestals.
            </p>

            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              That instinct isn't stupid; it comes from a desire to see good prevail. But we refuse to turn
              people into gods.
            </p>

            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Even the people who do the most visible good—the humanitarians, the innovators, the truth-tellers—are
              still human. They have been both harmed and harmful. They make tradeoffs we don't see.
            </p>

            <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold font-orbitron mb-4 text-cyan-400">
                Our stance is gratitude, not idolatry.
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  <span>We celebrate people who use their power well.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  <span>We stay clear-eyed about their limits.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  <span>We remember the invisible systems and workers behind every famous face.</span>
                </li>
              </ul>
            </div>

            <p className="text-gray-300 text-lg leading-relaxed">
              No leader is your conscience. We can learn from them, be moved by them, and still keep our own
              moral agency. We build cultures where no one has to be a god for good things to happen.
            </p>
          </div>
        </motion.div>

        {/* Principles Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold font-orbitron text-center mb-12 text-white glow-text-cyan">
            Our Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 group hover:border-cyan-500/30 transition-all backdrop-blur-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <principle.icon className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-orbitron mb-2 text-white">
                      {principle.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Philosophy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold font-orbitron text-center mb-8 text-white glow-text-cyan">
            Building Better Systems
          </h2>
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-8 backdrop-blur-sm">
            <p className="text-gray-300 leading-relaxed mb-4">
              You don't have to be pure to be good. Many of us use tools built by companies we disagree with,
              stand on the shoulders of imperfect systems, and benefit from infrastructure with hidden costs.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              The goal isn't purity—it's awareness and improvement. We can have gratitude for the infrastructure
              (the iPhone, the LLM, the reach) while maintaining clear eyes about the cost (the data mining, the
              labor, the risk).
            </p>
            <p className="text-gray-300 leading-relaxed">
              At Apex, we're committed to building systems that don't exploit people the same way. We're standing
              on giants' shoulders to build something that might eventually help fix the mess they made.
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
            Join the Commons
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Be part of a community that celebrates good work while staying grounded in reality.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            Learn More About Apex
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
