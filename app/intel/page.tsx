'use client'

import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function IntelPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const articles = [
    {
      slug: 'pokemon-151-set-analysis',
      title: 'Pokémon 151: Dissecting the Nostalgia Premium',
      excerpt: 'Economic analysis of the 2023 mega-set celebrating Kanto. Pull rates, chase card valuations, and why Hyper Rare Charizard ex is the most important modern card.',
      date: 'Jan 15, 2025',
      readTime: '9 min read',
      category: 'Set Analysis',
      isPremium: false,
      image: '/images/articles/pokemon-151-cards.png'
    },
    {
      slug: 'vintage-wotc-investment-guide',
      title: 'Vintage WOTC Cards: The Blue-Chip Investment Thesis',
      excerpt: 'Deep analysis of 1999-2003 Wizards of the Coast era cards, print run scarcity, PSA population dynamics, and why Base Set Charizard remains the S&P 500 of TCG investing.',
      date: 'Jan 10, 2025',
      readTime: '10 min read',
      category: 'Vintage Analysis',
      isPremium: false,
      image: '/images/articles/vintage-wotc.png'
    },
    {
      slug: 'modern-set-rotation-strategy',
      title: 'The Rotation Window: Timing Modern Format Transitions',
      excerpt: 'Strategic analysis of TCG set rotation mechanics, price volatility patterns, and optimal entry/exit points for Standard-to-Modern transitions.',
      date: 'Jan 5, 2025',
      readTime: '7 min read',
      category: 'Strategy',
      isPremium: false,
      image: '/images/articles/set-rotation-strategy.png'
    },
    {
      slug: 'japanese-vs-english-market-comparison',
      title: 'East vs. West: The 2025 Market Arbitrage Report',
      excerpt: 'Data-driven analysis of price disparity, print quality, and investment liquidity between Japanese and English Pokémon card markets.',
      date: 'Dec 28, 2024',
      readTime: '8 min read',
      category: 'Market Analysis',
      isPremium: false,
      image: '/images/articles/japan-vs-english.png'
    },
    {
      slug: 'psa-grading-roi-analysis',
      title: 'PSA Grading ROI: The Complete 2025 Analysis',
      excerpt: 'Comprehensive breakdown of PSA grading costs, turnaround times, and ROI calculations. When grading makes sense and when it destroys value.',
      date: 'Dec 20, 2024',
      readTime: '11 min read',
      category: 'Investment Guide',
      isPremium: false,
      image: '/images/articles/graded-cards-comparison.png'
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
            <Link key={article.slug} href={`/intel/${article.slug}`}>
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card-cyber group cursor-pointer h-full flex flex-col overflow-hidden"
              >
              {/* Featured Image */}
              {article.image && (
                <div className="w-full h-48 mb-4 -mx-6 -mt-6 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
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
            </Link>
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
