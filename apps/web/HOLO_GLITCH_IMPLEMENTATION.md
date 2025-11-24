# Enhanced Holo-Glitch Effect Implementation

## Overview
This document describes the implementation of enhanced cyberpunk visual effects for TCG card images, including particle bursts, sound effects (optional), and dramatic glitch animations aligned with Apex Intelligence's Cyberpunk F1 theme.

## Features Implemented

### 1. Enhanced Glitch Animations
- **Dramatic shifts**: 4-6px translation offsets with CSS variables for randomization
- **Hue rotation**: Full 360° hue-rotate filter for chaotic cyberpunk color shifts
- **Multi-layer shadows**: 3-layer box-shadows (20px, 40px, 60px + inset) alternating between cyan (#00eaff) and purple (#d946ef)
- **Faster animation**: 1s duration (down from 1.5s) for racing intensity
- **GPU acceleration**: Uses CSS transforms and filters for 60fps performance

### 2. Particle Burst Animation
- **Library**: @tsparticles/react with @tsparticles/preset-confetti
- **Configuration**:
  - 50 particles max (performance-optimized)
  - Cyan (#00eaff) and purple (#d946ef) colors
  - 1s burst duration
  - Confetti-style explosion on hover/focus
- **Performance**:
  - Lazy-loaded via dynamic imports
  - SSR disabled
  - Only renders when user interacts
  - Destroyed after 1s (no memory leaks)

### 3. Sound Effects (Framework Ready)
- **Library**: use-sound hook
- **Status**: Framework implemented, sound files not yet added
- **Context**: Global SoundContext for mute/unmute control
- **Integration points**: Lines 73-77 in HoloCardImage.tsx (commented out)
- **To enable**: Add sound files to `/public/sounds/` and uncomment playback code

### 4. Accessibility Features
All effects respect user preferences and accessibility standards:

#### Reduced Motion Support
```typescript
// Automatically detects prefers-reduced-motion
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
```
- **When enabled**:
  - Disables all animations (glitch, scanlines)
  - Static glow fallback with 20% opacity
  - No particle bursts
  - No sound effects
  - Preserves core visual identity

#### ARIA & Keyboard Support
- `role="img"` and `aria-label` for screen readers
- `tabIndex={0}` for keyboard navigation
- Focus states trigger same effects as hover (inclusive UX)

#### Sound Control
- Sounds muted by default on `prefers-reduced-motion`
- Global mute toggle via `SoundContext`
- User-triggered only (no autoplay blocks)

### 5. Performance Optimizations

#### Bundle Size Management
- **Lazy loading**: Particles loaded on-demand via dynamic imports
- **SSR disabled**: Particle library marked `{ ssr: false }`
- **Tree shaking**: Only confetti preset loaded (not full tsparticles)
- **Estimated impact**: ~50-100KB gzipped (particles + sound hook)

#### Runtime Performance
- **60fps target**: GPU-accelerated CSS (transform, filter, box-shadow)
- **INP optimization**:
  - Particle limit (50 max)
  - Burst duration capped at 1s
  - Effects only on user interaction (not autoplay)
- **Memory**: Particles destroyed after animation completes
- **CSS variables**: Random glitch offsets updated every 3s (not per-frame)

#### Core Web Vitals Alignment
| Metric | Target | Implementation |
|--------|--------|----------------|
| **LCP** | <2.5s | Image uses `priority` prop for eager loading |
| **INP** | <200ms | Particle bursts are async, limited count |
| **CLS** | <0.1 | Fixed dimensions, no layout shifts |

## File Structure

```
apps/web/
├── src/
│   ├── components/
│   │   └── titan/
│   │       └── HoloCardImage.tsx          # Enhanced component
│   ├── contexts/
│   │   ├── SoundContext.tsx               # Global sound state
│   │   └── index.ts                       # Barrel export
│   └── ...
├── public/
│   └── sounds/                            # Sound assets directory
│       └── README.md                      # Sound file requirements
├── tailwind.config.js                     # Enhanced keyframes with CSS vars
└── HOLO_GLITCH_IMPLEMENTATION.md          # This file
```

## Usage

### Basic Usage
```tsx
import { HoloCardImage } from '@/components/titan/HoloCardImage';

<HoloCardImage
  src="/images/card.png"
  alt="Charizard Holo Rare"
  width={250}
  height={350}
/>
```

### With Options
```tsx
<HoloCardImage
  src="/images/card.png"
  alt="Pikachu Promo"
  width={250}
  height={350}
  enableParticles={true}        // Default: true
  enableSound={false}            // Default: false (until sound files added)
  className="custom-class"
/>
```

### Adding Sound Context (App-wide)
Wrap your app in `SoundProvider` to enable global mute control:

```tsx
// app/layout.tsx
import { SoundProvider } from '@/contexts';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SoundProvider>
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}
```

### Mute Toggle Component
```tsx
'use client';
import { useSound } from '@/contexts';

export function MuteToggle() {
  const { isMuted, toggleMute } = useSound();

  return (
    <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
}
```

## Sound Files Setup

### Requirements
To enable sound effects, add these files to `/public/sounds/`:
- `glitch.mp3`: Neon glitch/hum (0.5s, <50KB, low-bitrate)
- `burst.mp3`: Particle explosion (0.5s, <50KB, low-bitrate)

### Where to Find Sounds
- **Free sources**: Freesound.org, Zapsplat.com (cyberpunk/glitch tags)
- **Recommended**: 64kbps MP3, mono, 0.5s duration
- **Post-processing**: Normalize volume, trim silence, apply slight distortion for cyberpunk vibe

### Enabling Sounds
1. Add sound files to `/public/sounds/`
2. In `HoloCardImage.tsx`, uncomment lines 73-77:
   ```tsx
   if (enableSound && !isMuted && !prefersReducedMotion) {
     playGlitch();
     playBurst();
   }
   ```
3. Add sound hook imports (already prepared in component)
4. Set `enableSound={true}` on component instances

## Testing & Validation

### Performance Testing
```bash
# Run with Chrome DevTools
1. Open Lighthouse (Performance + Accessibility audits)
2. Check Web Vitals panel for INP (<200ms on interactions)
3. Profile with Performance tab:
   - Aim for 60fps (16.67ms per frame)
   - Check JS execution time on hover
   - Verify no long tasks (>50ms)
```

### Accessibility Testing
```bash
# Browser DevTools
1. Enable "Reduce motion" in OS settings
2. Verify animations disable correctly
3. Test keyboard navigation (Tab to focus card)
4. Run axe DevTools extension (0 violations expected)

# Screen Readers
1. VoiceOver (Mac): VO + Space on card
2. NVDA (Windows): Arrow keys + Enter
3. Verify alt text announced correctly
```

### Cross-Browser Testing
| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 120+ | ✅ Tested | Full support |
| Safari 17+ | ⚠️ Manual test | Verify CSS vars work |
| Firefox 120+ | ⚠️ Manual test | Check filter performance |
| Edge 120+ | ✅ Expected | Chromium-based |

## Trade-Offs & Considerations

### ✅ Advantages
- **Immersive UX**: Particle bursts enhance cyberpunk theme without overwhelming
- **Performance**: Lazy-loading keeps initial bundle small
- **Accessibility**: Respects user preferences (reduced-motion, mute)
- **Scalable**: Easy to disable particles/sounds per-component
- **Modern**: GPU-accelerated CSS, no canvas overhead

### ❌ Potential Issues
- **Bundle size**: +50-100KB gzipped (particles + sound hook)
  - *Mitigation*: Code-split, lazy-load, only load on interaction
- **Low-end devices**: Intense glitch may strain GPU
  - *Mitigation*: Disable on `prefers-reduced-motion` or add device detection
- **User annoyance**: Noisy effects on every card
  - *Mitigation*: Mute toggle, sounds disabled by default
- **INP spike**: Many cards on page could cause stutter
  - *Mitigation*: Limit particles (50), short burst (1s), test with Web Vitals

## Next Steps
1. ✅ Install dependencies (@tsparticles, use-sound)
2. ✅ Update Tailwind config with enhanced keyframes
3. ✅ Implement HoloCardImage with particles
4. ✅ Create SoundContext for global mute
5. ⏳ **Add sound files** to `/public/sounds/`
6. ⏳ **Uncomment sound playback** in component
7. ⏳ **Add SoundProvider** to app layout
8. ⏳ **Run performance audits** (Lighthouse, Web Vitals)
9. ⏳ **Test accessibility** (axe, screen readers, reduced-motion)
10. ⏳ **Monitor bundle size** with Vercel Analytics

## Resources
- [knowledge-07-seo-performance.md](./knowledge-07-seo-performance.md) - Performance guidelines
- [tsparticles docs](https://particles.js.org/) - Particle configuration
- [use-sound docs](https://github.com/joshwcomeau/use-sound) - Sound hook API
- [Web Vitals](https://web.dev/vitals/) - Core metrics guide

## Support
For questions or issues:
1. Check this doc first
2. Review component code (`HoloCardImage.tsx`)
3. Test with reduced-motion enabled
4. Profile with Chrome DevTools
5. Open GitHub issue with repro steps

---
*Last updated: 2025-11-24*
*Implementation aligned with knowledge-07-seo-performance.md requirements*
