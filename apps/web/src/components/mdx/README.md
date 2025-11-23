# MDX Components Library

Custom React components for use in MDX articles. These components reinforce the **Holographic Anchor** visual identity and VARC technology positioning.

---

## Installation

Components are automatically available in all `.mdx` files via the `mdx-components.tsx` configuration.

**No imports needed** - just use them directly in your MDX content:

```mdx
---
title: "Your Article Title"
---

<DataCallout metric="12-16%" label="Japanese Sealed Outperformance" trend="↑" />

Your article content here...
```

---

## Component Catalog

### 1. DataCallout

**Purpose:** Highlight key metrics with holographic styling

**Props:**
- `metric` (string, required) - The numeric/percentage value
- `label` (string, required) - Description of the metric
- `trend` ('↑' | '↓' | '→', optional) - Directional indicator
- `confidence` (number 0-1, optional) - Confidence level (displays as progress bar)

**Example:**

```mdx
<DataCallout
  metric="12-16%"
  label="Japanese Sealed Outperformance"
  trend="↑"
  confidence={0.92}
/>
```

**Output:**
- Large holographic metric display
- Cyan gradient text
- Optional trend arrow (green ↑, red ↓, gray →)
- Optional confidence bar with percentage

**Use Cases:**
- ROI percentages
- Price differentials
- Market share statistics
- Performance metrics

---

### 2. VARCInsight

**Purpose:** AI-generated insights with visual distinction

**Props:**
- `children` (ReactNode, required) - The insight text
- `type` ('bullish' | 'bearish' | 'neutral', optional) - Sentiment indicator

**Example:**

```mdx
<VARCInsight type="bullish">
Portfolio construction should include 15-30% Japanese allocation for growth exposure and scarcity premium capture.
</VARCInsight>
```

**Output:**
- Bordered callout with holographic glow
- Sparkles icon (animated pulse)
- "[ VARC ANALYSIS ]" header
- Color-coded by type:
  - `bullish`: Green glow
  - `bearish`: Red glow
  - `neutral`: Cyan glow (default)

**Use Cases:**
- Investment recommendations
- Strategic implications
- Risk assessments
- Portfolio guidance

---

### 3. TerminalSection

**Purpose:** Display content in terminal-style container

**Props:**
- `command` (string, required) - Terminal command to display
- `status` ('running' | 'complete' | 'pending', optional) - Command status
- `children` (ReactNode, required) - Section content

**Example:**

```mdx
<TerminalSection command="analyze_market --segment=japanese" status="complete">

## Analysis Results

Market data shows 334% growth in collectible trading card sales...

</TerminalSection>
```

**Output:**
- Terminal window with macOS-style traffic lights
- Command line with status indicator (✓ complete, ⟳ running, ○ pending)
- Monospace font styling
- Black background with cyan accents

**Use Cases:**
- Technical findings sections
- Data output displays
- Code/command examples
- Research methodology breakdowns

---

## Existing Components

### SourceBadge

**Purpose:** Display verified source count

```mdx
<SourceBadge count={36} />
```

### PublishedTime

**Purpose:** Relative timestamp display

```mdx
<PublishedTime time="12 days ago" />
```

### SourceCards

**Purpose:** Featured source preview grid

```mdx
<SourceCards sources={frontMatter.sources} />
```

### HeroImage

**Purpose:** Article hero image with caption

```mdx
<HeroImage
  src="/images/articles/japan-vs-english.png"
  alt="Comparison of Japanese and English Pokemon cards"
  source="Screen Rant Analysis"
/>
```

### Interactive Charts

**Data Visualization Components:**

```mdx
<InteractiveLineChart
  data={priceData}
  title="Price Trend Analysis"
  xKey="month"
  yKey="avgPrice"
/>

<ScatterPlot
  data={gradeValueData}
  title="Grade Value Premium"
  xKey="grade"
  yKey="value"
/>

<BarChartViz
  data={segmentData}
  title="Performance Index"
  xKey="segment"
  yKey="value"
/>

<AreaChartViz
  data={perfData}
  title="Investment Performance (%)"
  xKey="month"
  yKey="roi"
/>
```

**Note:** Chart data must be exported as JavaScript arrays in your MDX file:

```mdx
export const priceData = [
  { month: "2024-10", avgPrice: 68 },
  { month: "2024-11", avgPrice: 82 },
  // ...
];
```

### Content Components

```mdx
<InfoBox>
Important information or warnings
</InfoBox>

<AskFollowUp />

<ShareButtons />

<TableOfContents />

<DiscoverMore relatedPosts={[...]} />

<ImageWithCaption
  src="/images/sample.png"
  alt="Description"
  caption="Figure 1: Sample chart"
  sourceUrl="https://source.com"
/>
```

---

## Styling Guide

### Color Tokens

All components use consistent color tokens:

- `text-cyan-400` - Primary highlights
- `border-cyan-500/20` - Subtle borders
- `bg-cyan-500/5` - Transparent backgrounds
- `shadow-[0_0_20px_rgba(34,211,238,0.15)]` - Holographic glow

### Typography

- **Headlines:** `.font-orbitron` (futuristic, technical)
- **Body:** Default Inter/system font
- **Data/Code:** `.font-mono` (monospace)

### Spacing

- Vertical rhythm: `my-6` (1.5rem) for components
- Internal padding: `p-6` (1.5rem) for callouts
- Consistent gap: `gap-4` (1rem) for flex layouts

---

## Component Composition Examples

### Market Analysis Article Structure

```mdx
---
title: "Japanese vs English Market Dynamics"
category: "Market Analysis"
heroImage: "/images/articles/japan-vs-english.png"
---

# Japanese vs English Market Dynamics

<SourceBadge count={36} />
<PublishedTime time="12 days ago" />

<HeroImage src={frontMatter.heroImage} alt="Comparison analysis" />

## Introduction

Market analysis shows significant price differentials...

<DataCallout
  metric="12-16%"
  label="Risk-Adjusted Outperformance"
  trend="↑"
  confidence={0.94}
/>

## Findings

<TerminalSection command="query_database --table=sealed_products" status="complete">

Analysis reveals Tag Team All Stars and Dream League maintain strongest appreciation curves at 28-34% annually.

</TerminalSection>

<InteractiveLineChart
  data={priceData}
  title="Japanese Exclusive Price Trend"
  xKey="month"
  yKey="avgPrice"
/>

## Implications

<VARCInsight type="bullish">
Portfolio construction should include 15-30% Japanese allocation for growth exposure and scarcity premium capture.
</VARCInsight>

<AskFollowUp />
```

---

## Best Practices

### DO:
✅ Use DataCallout for key metrics (1-3 per article)
✅ Use VARCInsight for actionable recommendations
✅ Include confidence scores when data-backed
✅ Match trend arrows to sentiment (↑ for positive growth)
✅ Use TerminalSection for technical/data-heavy sections

### DON'T:
❌ Overuse callouts (creates visual fatigue)
❌ Mix multiple VARCInsight types in same section
❌ Use DataCallout for non-numeric content
❌ Forget to export chart data arrays
❌ Use warm colors (breaks holographic aesthetic)

---

## Performance Considerations

**Component Bundle Size:**
- DataCallout: ~2KB
- VARCInsight: ~1.5KB (includes Lucide icon)
- TerminalSection: ~3KB

**Optimization:**
- All components are tree-shakeable
- Lazy-loaded on article pages only
- No runtime dependencies beyond React

---

## Accessibility

All components follow WCAG 2.1 AA standards:

- Semantic HTML structure
- Proper heading hierarchy
- Color contrast ≥ 4.5:1
- Keyboard navigable
- Screen reader compatible

**Testing:**
```bash
npm run test:a11y
```

---

## Development

### Adding New Components

1. Create component file in `/apps/web/src/components/mdx/YourComponent.tsx`
2. Export from `/apps/web/mdx-components.tsx`
3. Document in this README
4. Add TypeScript types
5. Test in sample article

### Component Template

```tsx
interface YourComponentProps {
  // Define props
}

export default function YourComponent({ }: YourComponentProps) {
  return (
    <div className="my-6 border border-cyan-500/30 bg-black/60 rounded-lg p-6">
      {/* Component content */}
    </div>
  );
}
```

---

## Troubleshooting

**Component not rendering:**
- Check `mdx-components.tsx` includes the import
- Verify component name matches exactly (case-sensitive)
- Ensure props are correctly typed

**Styling issues:**
- Run `npm run build` to regenerate Tailwind classes
- Check Tailwind config includes component directory
- Verify class names match Tailwind syntax

**Type errors:**
- Run `npm run type-check`
- Ensure all props have TypeScript interfaces
- Check MDX type definitions

---

## Resources

- [MDX Documentation](https://mdxjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Holographic Asset Guidelines](../../../docs/HOLOGRAPHIC_ASSET_GUIDELINES.md)

---

**Version:** 1.0.0
**Last Updated:** 2025-11-23
**Maintained By:** Apex Intelligence Engineering Team
