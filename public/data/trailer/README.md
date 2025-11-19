# 🎬 Apex Intelligence — Cinematic Trailer Data Assets

This directory contains all the real-world data used in the 18-second cinematic trailer launching November 20, 2025.

---

## 📊 Data Files

### 1. `umbreon-vmax-price-data.json`
**Umbreon VMAX Alternate Art Price Explosion**

Real-world inspired price movement showing a 247% gain in 28 days.

```json
{
  "card": "Umbreon VMAX Alternate Art (SWSH Evolving Skies)",
  "grading": "PSA 10",
  "timeframe": "Oct 15 - Nov 12, 2025",
  "percentIncrease": 247.1,
  "dataPoints": [
    {"date": "2025-10-15", "price": 340, "volume": 12},
    {"date": "2025-11-12", "price": 1180, "volume": 92}
  ]
}
```

**Used in**: Shot 4b (Data Onslaught — Panel B, 0:09.333 - 0:10.667)
- Area chart with cyan gradient fill
- Animated line drawing from $340 → $1,180
- Particle burst at peak point
- Annotation: "+247% in 28 days"

---

### 2. `pokemon-151-scatter-data.json`
**Pokémon 151 Set — 3D Market Analysis**

20 premium cards visualized in 3D space showing the relationship between popularity, price, and PSA population.

```json
{
  "setName": "Pokémon 151 (Scarlet & Violet)",
  "cards": [
    {
      "name": "Charizard ex SAR",
      "popularityScore": 95,
      "price": 875,
      "psaPopulation": 2400,
      "highlight": true
    },
    // ... 19 more cards
  ]
}
```

**Axes**:
- **X**: Popularity Score (0-100) — search volume, social mentions
- **Y**: Market Price ($0-$900) — PSA 10 current value
- **Z**: PSA Population (bubble size) — grading rarity

**Used in**: Shot 4c (Data Onslaught — Panel C, 0:10.667 - 0:12)
- 3D rotating scatter plot (360° Y-axis spin)
- Hero card: Charizard SAR (orange-cyan gradient, largest bubble)
- Camera lock-in with depth-of-field blur on other points

---

### 3. `arbitrage-opportunity-mock.json`
**Live Arbitrage Scanner Detection**

Mock data showing a $47k cross-platform arbitrage opportunity for Charizard Base Set 1st Edition PSA 10.

```json
{
  "card": "Charizard Base Set 1st Edition PSA 10",
  "platforms": {
    "seller": {"platform": "eBay US", "price": 89000},
    "buyer": {"platform": "Mercari JP", "price": 41770}
  },
  "arbitrage": {
    "grossSpread": 47230,
    "spreadPercent": 53.1,
    "netProfit": 44890,
    "roi": 107.4,
    "riskScore": 6.2
  }
}
```

**Used in**: Shot 4a (Data Onslaught — Panel A, 0:08 - 0:09.333)
- Red alert flash → Green profit zone
- Price delta visualization (red line $89k, green line $41.7k)
- Text: "ARBITRAGE DETECTED — $47,230 spread"
- Synced to bass drop at 0:08

---

### 4. `portfolio-performance-mock.json`
**Whale Portfolio Performance**

Top 1% TCG investor portfolio showing 236% returns in 11 months.

```json
{
  "portfolioId": "demo-whale-001",
  "timeframe": {"startDate": "2025-01-01", "endDate": "2025-11-18"},
  "performance": {
    "startingValue": 127431,
    "currentValue": 428901,
    "totalReturn": 236.5,
    "cagr": 68.4,
    "sharpeRatio": 8.7
  },
  "topHoldings": [
    {"card": "Pikachu Illustrator PSA 9", "percentOfPortfolio": 74.6},
    {"card": "Black Lotus Alpha BGS 9.5", "percentOfPortfolio": 14.6}
  ]
}
```

**Used in**: Shot 1 (Portfolio Explosion, 0:00 - 0:03)
- Animated counter: $127,431 → $428,901
- 2.5-second ticker animation with micro shake
- Large cyan glow effect (120pt Geist Mono)
- Text overlay: "in 11 months" (appears at 0:03)

---

### 5. `apex_trailer_captions.srt`
**Subtitle File for Accessibility**

SRT format subtitles synchronized to on-screen text.

```srt
1
00:00:00,500 --> 00:00:03,000
$428,901

2
00:00:03,000 --> 00:00:06,000
in 11 months

...
```

**Used in**: All platforms (especially LinkedIn, YouTube)
- Works with muted autoplay
- Accessibility compliance
- 7 caption segments
- Total duration: 18.5 seconds

---

## 🎨 How This Data Is Visualized

All data is transformed into cinematic visuals using:

- **Recharts** library (component compatibility)
- **After Effects** expressions (counter animations, graph drawing)
- **3D Camera** movements (rotation, zoom, lock-in)
- **Particle Systems** (burst effects at peak moments)
- **Color Grading**: Cyan (#00FFFF) and Purple (#9333ea) holographic theme

### Animation Techniques

1. **Counter Animation**: Uses `linear()` interpolation with comma formatting
2. **Graph Draw-In**: Trim Paths 0% → 100% with cyan glow trail
3. **3D Rotation**: Camera Y-rotation 0° → 360° over 1.3s
4. **Particle Burst**: CC Particle World radial explosion (50 particles, 0.5s)

---

## 📁 File Sizes

```
umbreon-vmax-price-data.json       1.2 KB
pokemon-151-scatter-data.json      3.8 KB
arbitrage-opportunity-mock.json    2.1 KB
portfolio-performance-mock.json    2.9 KB
apex_trailer_captions.srt          350 bytes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:                             10.3 KB
```

---

## 🚀 Usage in Production

### For After Effects Editors

1. **Import JSON files** as reference (data values, not direct import)
2. **Manually keyframe** graph paths based on data points
3. **Use expressions** from `/AE_EXPRESSIONS_LIBRARY.jsx` for animations
4. **Match timing** to master shot list in Production Bible
5. **Sync to audio** at critical points (especially 0:08 bass drop)

### For Web Developers (Future Integration)

These data structures can be reused for:
- Live dashboard visualizations on apexintelligence.center
- Real-time price tracking charts
- Portfolio performance calculators
- Arbitrage opportunity alerts
- Interactive 3D scatter plots

**Visualization Components**:
- `/src/components/charts/LiveScatter.tsx` (scatter plot)
- `/src/components/charts/PriceSparkline.tsx` (price graphs)
- `/src/components/mdx/AreaChartViz.tsx` (area charts)
- `/src/components/mdx/InteractiveLineChart.tsx` (line charts)

---

## 🎯 Data Accuracy

All data is **inspired by real-world TCG market movements** but **fictionalized for demonstration purposes**.

- **Umbreon VMAX**: Based on actual alt-art price volatility patterns (2022-2025)
- **Pokémon 151**: Real set, realistic card prices as of Q4 2025 projections
- **Charizard Base Set**: Historical arbitrage opportunities observed in 2023-2024
- **Portfolio Performance**: Modeled after top-performing TCG investor returns (60-80% CAGR achievable)

**Disclaimer**: Past performance does not guarantee future results. This data is for cinematic storytelling and should not be considered financial advice.

---

## 📊 Data Sources (Inspiration)

Real-world data aggregated from:
- **eBay Sold Listings** (price history)
- **PSA Population Report** (grading data)
- **TCGPlayer Market Price** (current values)
- **Mercari Japan** (cross-border arbitrage)
- **StockX Trading Cards** (market trends)
- **PWCC Marketplace** (auction results)
- **130Point** (portfolio tracking inspiration)

---

## 🐺 The Hunt Is Over

These 5 data files represent the intelligence that Apex brings to the $10B+ trading card market.

**Launch**: November 20, 2025
**Platforms**: X, Instagram, TikTok, LinkedIn, Discord
**Goal**: 50,000+ views in 48 hours

---

*For full production details, see:*
- `/CINEMATIC_TRAILER_PRODUCTION_BIBLE.md`
- `/QUICK_START_GUIDE.md`
- `/AE_EXPRESSIONS_LIBRARY.jsx`
- `/TRAILER_DELIVERY_SUMMARY.md`
