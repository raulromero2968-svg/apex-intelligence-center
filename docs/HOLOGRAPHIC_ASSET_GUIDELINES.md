# Holographic Asset Guidelines

## Visual Identity System

The Apex Intelligence Center uses a **"Holographic Anchor"** visual identity system that reinforces our VARC (Vision-Based Abstract Reasoning) technology positioning. All visual assets should align with this high-tech, futuristic aesthetic.

---

## Core Design Principles

### 1. Color Palette

**Primary Holographic:**
- Cyan (#22d3ee) - Primary holographic glow
- Electric Blue (#0ea5e9) - Secondary accent
- Purple (#a855f7) - Complementary highlight
- Black (#030712) - Deep background

**Usage:**
```css
/* Holographic glow effect */
drop-shadow: 0 0 8px rgba(34, 211, 238, 0.6);
box-shadow: 0 0 20px rgba(34, 211, 238, 0.15);

/* Gradient overlays */
background: linear-gradient(to right,
  rgba(34, 211, 238, 0.2),
  rgba(168, 85, 247, 0.2)
);
```

### 2. Typography

**Primary Font:** Orbitron (headings, metrics, technical elements)
**Secondary Font:** Inter/System (body text, descriptions)
**Mono Font:** Fira Code/Mono (data, code, terminal elements)

---

## Hero Image Specifications

### Technical Requirements

**Dimensions:**
- Width: 1200px minimum (1920px recommended)
- Height: 630px (16:9 aspect ratio optimal)
- Format: PNG or WebP (PNG preferred for transparency)
- File size: < 500KB (optimize with TinyPNG/Squoosh)

**File Naming:**
- Pattern: `{category}-{topic}-{variant}.png`
- Examples:
  - `market-analysis-jp-vs-en.png`
  - `research-grading-impact.png`
  - `guide-portfolio-building.png`

**Storage:**
- Location: `/public/images/articles/`
- Backup: Version control (git LFS if > 1MB)

---

## Visual Style Specifications

### For Market Analysis Articles

**Core Elements:**
1. **Data visualization** (chart/graph) as focal point
2. **Holographic wireframe overlay** (low opacity)
3. **Cyan glow effects** on key data points
4. **Depth via layering** (background gradient, midground data, foreground highlights)

**Example Composition:**
```
[Background: Dark gradient #030712 → #0a1628]
  └─ [Midground: Chart/graph with cyan (#22d3ee) primary lines]
      └─ [Foreground: Holographic wireframe overlay at 20% opacity]
          └─ [Glow effects: 8px cyan blur on key data points]
```

**Prohibited:**
- ❌ Flat, solid colors without gradients
- ❌ Stock photos without processing
- ❌ Warm color schemes (orange, red, yellow dominance)
- ❌ Low contrast (must pass WCAG AA at minimum)

---

## Hero Image Types

### Type 1: Data Comparison
**Use Case:** JP vs EN, PSA 10 vs 9, Pokemon vs One Piece

**Template:**
- Split screen (50/50 or 60/40)
- Side-by-side comparison
- Connecting lines/arrows with cyan glow
- Metric callouts in corners

**Example:** `japan-vs-english.png`

### Type 2: Trend Visualization
**Use Case:** Q1 2025 Trends, Sealed ROI Analysis

**Template:**
- Line/area chart as primary element
- Time series on X-axis
- Holographic grid background
- Peak/trough annotations with glow

**Example:** `market-analysis-chart.png`

### Type 3: Graded Cards
**Use Case:** Grading impact, PSA guides

**Template:**
- PSA slab mockups (can be wireframe)
- Grade progression (6 → 7 → 8 → 9 → 10)
- Value differentials as overlays
- Holographic authentication feel

**Example:** `graded-cards-comparison.png`

---

## Processing Existing Images

If you have existing assets that need "holographic upgrade":

### Quick Photoshop/Figma Recipe:

1. **Base Layer:** Original image at 80% opacity
2. **Gradient Overlay:** Linear gradient from #030712 (left) to transparent (right), blend mode: Multiply
3. **Wireframe Layer:** Add cyan (#22d3ee) geometric lines/shapes at 15-25% opacity
4. **Glow Effects:**
   - Outer Glow: Cyan, 8-12px spread, 60% opacity
   - Inner Glow: White, 4px spread, 30% opacity
5. **Color Grading:**
   - Shift highlights toward cyan (+15 on cyan channel)
   - Deepen shadows toward blue (-10 on red channel)
   - Boost contrast (+20)

### CSS Processing (if using `<img>` wrapper):

```css
.hero-image {
  filter:
    contrast(1.2)
    brightness(0.9)
    drop-shadow(0 0 12px rgba(34, 211, 238, 0.4));
}

.hero-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(34, 211, 238, 0.1) 0%,
    transparent 50%,
    rgba(168, 85, 247, 0.1) 100%
  );
  pointer-events: none;
}
```

---

## Source Thumbnails

**Location:** `/public/images/sources/`

**Specifications:**
- Dimensions: 96x96px
- Format: PNG with transparency
- Style: Favicon/logo of source site
- Border: 1px solid cyan (#22d3ee) at 30% opacity
- Padding: 8px internal spacing
- Background: Black (#030712) or transparent

**File Naming:**
- Pattern: `{domain}.png`
- Examples: `screenrant.png`, `tcgplayer.png`, `psacard.png`

**Generation Method:**
1. Extract favicon from source site
2. Upscale to 96x96 if needed (maintain aspect ratio)
3. Add subtle cyan glow: `box-shadow: 0 0 6px rgba(34, 211, 238, 0.3)`
4. Export as PNG

---

## Component Integration

### HeroImage Component Usage

```tsx
<HeroImage
  src="/images/articles/japan-vs-english.png"
  alt="Side-by-side comparison of Japanese and English Pokemon cards with price differentials"
  source="Screen Rant JP vs EN Analysis"
/>
```

**Props:**
- `src`: Path to image in `/public/images/articles/`
- `alt`: Descriptive alt text (SEO + accessibility)
- `source`: Optional attribution (renders as caption)

**Current Styling:**
- Border: `border-cyan-500/20`
- Container: `h-[400px]` responsive
- Hover: Subtle scale + glow enhancement (TODO)

---

## Quality Checklist

Before publishing hero images:

- [ ] Dimensions meet minimum specs (1200x630)
- [ ] File size < 500KB
- [ ] Cyan glow effects present
- [ ] Passes contrast check (text readable if overlaid)
- [ ] No copyright violations
- [ ] Filename follows naming convention
- [ ] Alt text written (descriptive, 80-120 chars)
- [ ] Source attribution documented if applicable

---

## Tools & Resources

**Recommended Design Tools:**
- Figma (vector wireframes, prototyping)
- Photoshop (image processing, effects)
- Blender (3D holographic elements - advanced)

**Optimization:**
- TinyPNG: https://tinypng.com/
- Squoosh: https://squoosh.app/
- ImageOptim (macOS): https://imageoptim.com/

**Inspiration Sources:**
- Sci-fi UI kits (Blade Runner, Minority Report aesthetics)
- Data visualization libraries (D3.js examples, Observable)
- Holographic projection mockups (Dribbble, Behance)

---

## Examples by Category

### Market Analysis
- `japan-vs-english.png` - Split comparison with price differentials
- `market-analysis-chart.png` - Time series trend with holographic grid
- `graded-cards-comparison.png` - PSA grade progression

### Research
- `sealed-product-study.png` - ROI data visualization
- `grading-company-comparison.png` - Multi-variable comparison matrix

### Guides
- `portfolio-building.png` - Allocation pie charts with glow
- `storage-preservation.png` - Product photography with holographic overlay

---

## Future Enhancements

**Phase 2 (Planned):**
- [ ] Animated hero images (subtle particle effects)
- [ ] Interactive hero overlays (hover reveals data layers)
- [ ] AI-generated holographic backgrounds
- [ ] Real-time chart integration (fetch live data)

---

## Contact & Questions

For asset review or design consultation:
- Check existing assets in `/public/images/articles/`
- Review component code in `/apps/web/src/components/mdx/HeroImage.tsx`
- Reference this guide when creating new assets

**Remember:** Every visual asset is a reinforcement of the "Future of TCG Analytics" brand promise. Make it look like intelligence from 2030.
