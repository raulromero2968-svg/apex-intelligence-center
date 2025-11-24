'use client'

import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { INTEL_ARCHIVE, getAllCategories, getArticlesByCategory } from '@/lib/data/intel-archive'
import { IntelGridCard } from '@/components/intel/IntelGridCard'

export default function IntelPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = getAllCategories()

  // Filter by category first
  const categoryFiltered = getArticlesByCategory(activeCategory)

  // Then filter by search query
  const displayedArticles = categoryFiltered.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <main className="min-h-screen pt-24 px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Intelligence</span>
          </h1>
          <p className="text-slate-400">
            Market insights, research, and analysis across all TCG markets. Verified by data.
          </p>
        </motion.div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neon-cyan" size={20} />
            <input
              type="text"
              placeholder="Search intel drops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-cyber-dark/50 border border-neon-cyan/30 rounded-lg
                       text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none
                       focus:shadow-neon-cyan transition-all backdrop-blur-md"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-2 mb-12 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === category
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-[0_0_15px_rgba(148,163,184,0.1)]'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Intelligence Archive Grid - Restored Alpha Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {displayedArticles.map((article) => (
            <IntelGridCard key={article.id} item={article} />
          ))}
        </div>

        {/* No Results */}
        {displayedArticles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No intel drops found. Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Subscribe CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 relative rounded-2xl p-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/10 backdrop-blur-xl" />
          <div className="absolute inset-0 neon-border" />
          
          <div className="relative text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] mb-4 text-glow-cyan">
              Want Premium Intel?
            </h2>
            <p className="text-gray-300 mb-8">
              Subscribe to get exclusive market analysis, early access to research, and premium investment guides.
            </p>
            <Link href="/subscribe" className="btn-primary inline-flex items-center">
              Subscribe Now
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
