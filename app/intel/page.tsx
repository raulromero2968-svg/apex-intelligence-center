'use client'

import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function IntelPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const articles = [
    {
      slug: 'q4-2024-market-analysis',
      title: 'Q4 2024 TCG Market Analysis',
      excerpt: 'Comprehensive breakdown of TCG market performance, top-performing sets, and investment opportunities heading into Q4 2024.',
      date: 'Oct 25, 2024',
      readTime: '8 min read',
      category: 'Market Analysis',
      isPremium: false
    },
    {
      slug: 'pokemon-151-value-trajectory',
      title: 'Pokemon 151: Value Trajectory Analysis',
      excerpt: 'Deep dive into Pokemon 151 market performance, chase card analysis, and long-term investment potential for serious collectors.',
      date: 'Oct 20, 2024',
      readTime: '6 min read',
      category: 'Set Analysis',
      isPremium: false
    },
    {
      slug: 'graded-vs-raw-2024',
      title: 'Graded vs Raw: 2024 Edition',
      excerpt: 'Updated ROI analysis on graded vs raw cards, grading service comparison, and when it makes sense to grade your collection.',
      date: 'Oct 15, 2024',
      readTime: '10 min read',
      category: 'Investment Guide',
      isPremium: true
    },
    {
      slug: 'japanese-vs-english-market',
      title: 'Japanese vs English: Market Comparison',
      excerpt: 'Price analysis comparing Japanese and English TCG markets, arbitrage opportunities, and investment considerations.',
      date: 'Oct 10, 2024',
      readTime: '7 min read',
      category: 'Market Analysis',
      isPremium: true
    },
    {
      slug: 'modern-set-rotation-strategy',
      title: 'Modern Set Rotation Investment Strategy',
      excerpt: 'How to capitalize on set rotations, which cards to target, and timing your buys for maximum returns.',
      date: 'Oct 5, 2024',
      readTime: '9 min read',
      category: 'Strategy',
      isPremium: false
    },
    {
      slug: 'vintage-wotc-market-report',
      title: 'Vintage WOTC Market Report Q3 2024',
      excerpt: 'Quarterly analysis of Wizards of the Coast vintage card performance, including Base Set, Jungle, and Fossil.',
      date: 'Sep 30, 2024',
      readTime: '12 min read',
      category: 'Vintage Analysis',
      isPremium: true
    }
  ]

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = ['All', 'Market Analysis', 'Set Analysis', 'Investment Guide', 'Strategy', 'Vintage Analysis']
  const [activeCategory, setActiveCategory] = useState('All')

  const displayedArticles = activeCategory === 'All'
    ? filteredArticles
    : filteredArticles.filter(article => article.category === activeCategory)

  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-orbitron)] mb-4 text-glow-cyan">
            Intelligence Archive
          </h1>
          <p className="text-xl text-gray-400">
            Deep market analysis, data-driven insights, and exclusive intelligence for serious TCG collectors.
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
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                ${activeCategory === category
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan shadow-neon-cyan'
                  : 'bg-cyber-dark/30 text-gray-400 border border-gray-700 hover:border-neon-cyan/50'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedArticles.map((article, index) => (
            <motion.article
              key={article.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-cyber group cursor-pointer h-full flex flex-col"
            >
              {article.isPremium && (
                <div className="inline-block mb-3 px-3 py-1 rounded-full bg-neon-pink/20 border border-neon-pink/50 w-fit">
                  <span className="text-xs font-semibold text-neon-pink">PREMIUM</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-neon-cyan">{article.category}</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-400">{article.readTime}</span>
              </div>
              
              <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)] mb-3 group-hover:text-neon-cyan transition-colors">
                {article.title}
              </h3>
              
              <p className="text-gray-400 text-sm mb-4 flex-grow">
                {article.excerpt}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-neon-cyan/20">
                <span className="text-xs text-gray-500">{article.date}</span>
                <div className="flex items-center text-neon-cyan group-hover:translate-x-2 transition-transform text-sm font-semibold">
                  Read More
                  <ArrowRight className="ml-2" size={16} />
                </div>
              </div>
            </motion.article>
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
    </div>
  )
}
