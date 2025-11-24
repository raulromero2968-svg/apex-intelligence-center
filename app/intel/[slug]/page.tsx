'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Tag, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import IntelChart from '@/components/intel/IntelChart'

// Article data (in a real app, this would come from a CMS or database)
const articles: Record<string, any> = {
  'q4-2024-market-analysis': {
    title: 'Q4 2024 TCG Market Analysis',
    date: 'Oct 25, 2024',
    readTime: '8 min read',
    category: 'Market Analysis',
    author: 'Apex Intelligence Research Team',
    content: `
## Executive Summary

The Q4 2024 TCG market has shown remarkable resilience despite broader economic headwinds. Pokemon continues to dominate with a 68% market share, while Magic: The Gathering and Yu-Gi-Oh! maintain steady positions at 18% and 9% respectively.

### Key Findings

**Market Performance:**
- Overall TCG market up 12.3% YoY
- Pokemon leading with 68% market share
- Modern sets outperforming vintage by 8.2%
- Graded card premiums increasing to 3.2x raw prices

**Top Performing Sets:**
1. Pokemon 151 (+45% since release)
2. MTG Lord of the Rings (+32% since release)
3. Pokemon Obsidian Flames (+28% since release)

## Market Breakdown by Game

### Pokemon TCG

Pokemon continues its dominance with the 151 set being the breakout performer of 2024. Chase cards like Charizard ex and Mew ex have seen sustained demand, with PSA 10 copies commanding 4-5x raw prices.

**Key Metrics:**
- Average set ROI: +18.2%
- Graded card premium: 3.8x
- Market liquidity: High
- Investment grade: A+

**Notable Price Movements:**
- Charizard ex (151): $180 → $285 (+58%)
- Mew ex (151): $95 → $165 (+74%)
- Umbreon VMAX (Evolving Skies): $210 → $340 (+62%)

### Magic: The Gathering

The Lord of the Rings crossover set exceeded expectations, with The One Ring becoming one of the most sought-after cards in modern MTG history. Reserved List cards continue their steady appreciation.

**Key Metrics:**
- Average set ROI: +14.8%
- Reserved List appreciation: +22.3%
- Market liquidity: Medium-High
- Investment grade: A

**Notable Price Movements:**
- The One Ring (Serialized): $2M+ (auction record)
- The One Ring (Regular): $85 → $120 (+41%)
- Black Lotus (Alpha): $450K → $520K (+16%)

### Yu-Gi-Oh!

Yu-Gi-Oh! maintains steady performance with competitive play driving demand. 25th Anniversary sets have shown strong collector interest.

**Key Metrics:**
- Average set ROI: +9.4%
- Competitive staples premium: 2.1x
- Market liquidity: Medium
- Investment grade: B+

## Investment Opportunities

### Short-Term (3-6 months)

**Pokemon 151 Singles**
- Current entry point remains favorable
- Chase cards showing sustained demand
- Grading backlog creating supply constraints

**Recommendation:** BUY
**Risk Level:** Low-Medium
**Expected Return:** 15-25%

### Medium-Term (6-12 months)

**MTG Reserved List**
- Historical 20%+ annual appreciation
- Limited supply driving long-term value
- Institutional buyers entering market

**Recommendation:** STRONG BUY
**Risk Level:** Low
**Expected Return:** 18-30%

### Long-Term (12+ months)

**Vintage WOTC Pokemon**
- Base Set, Jungle, Fossil showing renewed interest
- PSA 10 population reports favorable
- Nostalgia cycle driving millennial demand

**Recommendation:** BUY AND HOLD
**Risk Level:** Low
**Expected Return:** 25-40%

## Market Risks

### Supply Chain Concerns

Print runs for modern sets remain elevated, potentially diluting long-term value. However, chase card ratios have tightened, creating scarcity at the high end.

### Economic Headwinds

Rising interest rates and inflation concerns could impact discretionary spending. However, TCGs have historically shown resilience during economic downturns.

### Grading Service Delays

PSA and BGS continue to face backlogs, creating temporary supply constraints. This is bullish for already-graded cards but creates uncertainty for raw card valuations.

## Recommendations

### For Collectors

1. **Focus on chase cards** from proven sets (151, Evolving Skies)
2. **Grade selectively** - only cards with PSA 10 potential
3. **Diversify** across games and eras
4. **Buy dips** on established cards during market corrections

### For Investors

1. **Allocate 60%** to proven vintage (WOTC, Reserved List)
2. **Allocate 30%** to modern chase cards (151, LOTR)
3. **Allocate 10%** to speculative plays (upcoming sets)
4. **Rebalance quarterly** based on market performance

## Q4 Outlook

We expect continued strength through the holiday season, with Pokemon Scarlet & Violet: Paldean Fates and MTG's Murders at Karlov Manor driving Q1 2025 momentum.

**Market Forecast:**
- Q4 2024: +5-8% overall market growth
- Pokemon: Continued dominance, watch Paldean Fates
- MTG: Reserved List strength, modern set volatility
- Yu-Gi-Oh!: Steady performance, competitive meta shifts

## Conclusion

The TCG market remains healthy with strong fundamentals. Smart collectors and investors should focus on proven performers while maintaining diversification. The combination of supply constraints, growing demand, and institutional interest creates a favorable environment for long-term value appreciation.

**Overall Market Grade: A-**

---

*This analysis is for informational purposes only and does not constitute financial advice. Always do your own research before making investment decisions.*
    `,
    chartData: [
      { month: 'Jan', value: 100 },
      { month: 'Feb', value: 105 },
      { month: 'Mar', value: 108 },
      { month: 'Apr', value: 112 },
      { month: 'May', value: 115 },
      { month: 'Jun', value: 118 },
      { month: 'Jul', value: 122 },
      { month: 'Aug', value: 125 },
      { month: 'Sep', value: 128 },
      { month: 'Oct', value: 132 },
    ],
    tags: ['Market Analysis', 'Pokemon', 'MTG', 'Investment', 'Q4 2024']
  },
  'pokemon-151-value-trajectory': {
    title: 'Pokemon 151: Value Trajectory Analysis',
    date: 'Oct 20, 2024',
    readTime: '6 min read',
    category: 'Set Analysis',
    author: 'Apex Intelligence Research Team',
    content: `
## Overview

Pokemon 151 has emerged as one of the strongest performing sets of 2024, with sustained demand and favorable pull rates creating an ideal environment for both collectors and investors.

## Set Performance

Since its release in June 2024, Pokemon 151 has appreciated an average of 45% across chase cards, significantly outperforming the broader market.

### Chase Card Analysis

**Charizard ex (165/165)**
- Release price: $180
- Current price: $285
- Gain: +58%
- PSA 10 premium: 4.2x

**Mew ex (151/165)**
- Release price: $95
- Current price: $165
- Gain: +74%
- PSA 10 premium: 3.8x

**Erika's Invitation (Full Art)**
- Release price: $45
- Current price: $85
- Gain: +89%
- PSA 10 premium: 3.2x

## Investment Thesis

Pokemon 151 represents a rare combination of factors that drive long-term value:

1. **Nostalgia Factor:** Original 151 Pokemon resonate with millennial collectors
2. **Art Quality:** Full art cards feature exceptional artwork
3. **Pull Rates:** Favorable ratios create scarcity without frustration
4. **Playability:** Several cards see competitive play

## Price Targets

### 6-Month Outlook
- Charizard ex: $320-350 (+12-23%)
- Mew ex: $190-220 (+15-33%)
- Erika's Invitation: $95-110 (+12-29%)

### 12-Month Outlook
- Charizard ex: $380-420 (+33-47%)
- Mew ex: $240-280 (+45-70%)
- Erika's Invitation: $110-130 (+29-53%)

## Conclusion

Pokemon 151 remains a strong buy for collectors and investors. The combination of nostalgia, quality, and scarcity creates a favorable long-term outlook.

**Set Grade: A+**
    `,
    chartData: [
      { month: 'Jun', value: 100 },
      { month: 'Jul', value: 115 },
      { month: 'Aug', value: 125 },
      { month: 'Sep', value: 138 },
      { month: 'Oct', value: 145 },
    ],
    tags: ['Pokemon', 'Set Analysis', 'Investment', '151']
  },
  'graded-vs-raw-2024': {
    title: 'Graded vs Raw: 2024 Edition',
    date: 'Oct 15, 2024',
    readTime: '10 min read',
    category: 'Investment Guide',
    author: 'Apex Intelligence Research Team',
    content: `
## The Grading Decision

One of the most common questions in TCG investing: should you grade your cards? This comprehensive guide breaks down the economics, timing, and strategy of card grading in 2024.

## Grading Economics

### Cost Analysis

**PSA Grading Costs (2024):**
- Regular: $25/card (45-60 day turnaround)
- Express: $75/card (10-15 day turnaround)
- Super Express: $150/card (2-5 day turnaround)

**BGS Grading Costs (2024):**
- Standard: $20/card (30-45 day turnaround)
- Express: $65/card (7-10 day turnaround)

### Premium Analysis

**Average Graded Premiums by Grade:**
- PSA 10: 3.2x raw price
- PSA 9: 1.4x raw price
- BGS 10 (Black Label): 5.8x raw price
- BGS 9.5: 2.1x raw price

## When to Grade

### Grade These Cards:

1. **Near-mint vintage cards** ($100+ raw value)
2. **Modern chase cards** with centering 55/45 or better
3. **Cards with PSA 10 population < 100**
4. **First edition WOTC** in excellent condition

### Don't Grade These Cards:

1. **Modern bulk** (< $50 raw value)
2. **Cards with visible defects**
3. **Off-center cards** (worse than 60/40)
4. **High population commons**

## ROI Calculations

### Example: Charizard ex (Pokemon 151)

**Scenario 1: Grade Immediately**
- Raw card cost: $285
- Grading cost: $25
- Total investment: $310
- PSA 10 value: $1,200
- Net profit: $890
- ROI: 287%

**Scenario 2: Hold Raw**
- Raw card cost: $285
- 12-month appreciation: +47%
- Future value: $419
- Net profit: $134
- ROI: 47%

**Verdict:** Grade if confident in PSA 10 grade

## Grading Strategy

### For Collectors

1. **Grade your favorites** regardless of economics
2. **Protect high-value cards** with professional grading
3. **Consider BGS** for modern cards (subgrades add value)
4. **Use bulk submissions** to reduce per-card costs

### For Investors

1. **Grade selectively** - only PSA 10 candidates
2. **Time submissions** during slow periods (lower costs)
3. **Focus on vintage** (higher premiums)
4. **Track population reports** (avoid oversaturated cards)

## Service Comparison

### PSA
- **Pros:** Market leader, highest liquidity, best resale
- **Cons:** Slower turnaround, higher costs
- **Best for:** Vintage cards, maximum resale value

### BGS
- **Pros:** Subgrades, Black Label premium, faster service
- **Cons:** Lower liquidity, smaller market
- **Best for:** Modern cards, personal collection

### CGC
- **Pros:** Fastest turnaround, lowest cost, subgrades
- **Cons:** Lowest market acceptance, smallest premiums
- **Best for:** Budget grading, modern bulk

## 2024 Market Trends

**Grading Volume:**
- PSA submissions up 28% YoY
- BGS submissions up 15% YoY
- CGC submissions up 42% YoY

**Premium Trends:**
- PSA 10 premiums increasing (+0.4x vs 2023)
- BGS Black Label premiums stable
- Raw card demand softening (-8% vs 2023)

## Recommendations

### Immediate Action Items

1. **Inventory your collection** - identify grading candidates
2. **Check centering** with a ruler or centering tool
3. **Research population reports** on PSA/BGS websites
4. **Calculate ROI** before submitting

### Long-Term Strategy

1. **Build a grading pipeline** - submit quarterly
2. **Diversify services** - use PSA for vintage, BGS for modern
3. **Track your results** - learn what grades well
4. **Stay informed** - grading standards evolve

## Conclusion

Grading remains a powerful tool for collectors and investors, but it requires careful analysis and selective application. Focus on high-value cards with strong centering, and always calculate your ROI before submitting.

**Grading Strategy Grade: A**

---

*Grading costs and turnaround times subject to change. Always check current pricing before submitting.*
    `,
    chartData: [
      { month: '2020', value: 100 },
      { month: '2021', value: 180 },
      { month: '2022', value: 240 },
      { month: '2023', value: 280 },
      { month: '2024', value: 320 },
    ],
    tags: ['Grading', 'Investment Guide', 'PSA', 'BGS', 'Strategy']
  }
}

export default function ArticlePage() {
  const params = useParams()
  const slug = params?.slug as string
  const article = articles[slug]

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <Link href="/intel" className="btn-primary">
            Back to Intelligence Archive
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container-custom max-w-4xl">
        {/* Back Button */}
        <Link 
          href="/intel" 
          className="inline-flex items-center text-neon-cyan hover:text-cyan-300 mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Intelligence Archive
        </Link>

        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="px-3 py-1 rounded-full bg-neon-cyan/20 border border-neon-cyan text-neon-cyan text-sm font-semibold">
              {article.category}
            </span>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar size={16} />
              {article.date}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock size={16} />
              {article.readTime}
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-orbitron)] mb-4 text-glow-cyan">
            {article.title}
          </h1>

          <p className="text-gray-400">
            By {article.author}
          </p>
        </motion.div>

        {/* Market Performance Chart */}
        {article.chartData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="card-cyber p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-neon-cyan" size={24} />
                Market Performance
              </h3>
              <IntelChart data={article.chartData} />
            </div>
          </motion.div>
        )}

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="prose prose-invert prose-cyan max-w-none mb-12"
        >
          <div 
            className="article-content text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content.split('\n').map((line: string) => {
              if (line.startsWith('## ')) {
                return `<h2 class="text-3xl font-bold font-orbitron mt-12 mb-6 text-neon-cyan text-glow-cyan">${line.slice(3)}</h2>`
              } else if (line.startsWith('### ')) {
                return `<h3 class="text-2xl font-bold font-orbitron mt-8 mb-4 text-cyan-300">${line.slice(4)}</h3>`
              } else if (line.startsWith('**') && line.endsWith('**')) {
                return `<p class="font-bold text-white my-4">${line.slice(2, -2)}</p>`
              } else if (line.startsWith('- ')) {
                return `<li class="ml-6 my-2">${line.slice(2)}</li>`
              } else if (line.startsWith('1. ') || line.match(/^\d+\. /)) {
                return `<li class="ml-6 my-2">${line.replace(/^\d+\. /, '')}</li>`
              } else if (line.trim() === '---') {
                return `<hr class="my-8 border-neon-cyan/30" />`
              } else if (line.trim() === '') {
                return '<br />'
              } else if (line.startsWith('*') && line.endsWith('*')) {
                return `<p class="text-gray-500 italic my-4">${line.slice(1, -1)}</p>`
              } else {
                return `<p class="my-4">${line}</p>`
              }
            }).join('') }}
          />
        </motion.div>

        {/* Tags */}
        {article.tags && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 mb-12"
          >
            {article.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-cyber-dark/50 border border-neon-cyan/30 text-gray-400 text-sm"
              >
                <Tag size={14} className="inline mr-1" />
                {tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* Subscribe CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative rounded-2xl p-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/10 backdrop-blur-xl" />
          <div className="absolute inset-0 neon-border" />
          
          <div className="relative text-center">
            <h2 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] mb-4 text-glow-cyan">
              Get More Intel Like This
            </h2>
            <p className="text-gray-300 mb-8">
              Subscribe to receive exclusive market analysis, investment guides, and premium research delivered to your inbox.
            </p>
            <Link href="/subscribe" className="btn-primary inline-flex items-center">
              Subscribe Now
              <ArrowLeft className="ml-2 rotate-180" size={20} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
