# Holo-Glitch Effect Testing Guide

## Quick Start Testing

### 1. Visual Testing (Local Development)
```bash
# Start the development server
pnpm dev

# Navigate to any page with HoloCardImage components
# Example: /cards, /collection, etc.
```

**What to verify:**
- [ ] Card has cyan/purple glowing border
- [ ] Scanlines animate (pulsing effect)
- [ ] Card scales slightly on hover (1.05x)
- [ ] Glitch animation runs smoothly (no jank)
- [ ] Particle burst appears on hover (cyan/purple confetti)
- [ ] Effects reset after hover ends

### 2. Performance Testing

#### Chrome DevTools Performance
```bash
1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Start recording
4. Hover over multiple cards
5. Stop recording after 5-10 seconds
```

**Target metrics:**
- [ ] FPS: ≥ 55fps (aim for 60fps)
- [ ] Long Tasks: None > 50ms
- [ ] Main Thread: <70% utilization
- [ ] GPU Memory: No spikes > 100MB

#### Lighthouse Audit
```bash
# Run Lighthouse in Chrome DevTools
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Performance" + "Accessibility"
4. Run audit on a page with cards
```

**Target scores:**
- [ ] Performance: ≥ 90
- [ ] Accessibility: 100
- [ ] INP: < 200ms (Web Vitals)
- [ ] CLS: < 0.1
- [ ] No console errors

#### Bundle Size Check
```bash
# Build and analyze bundle
pnpm build

# Check bundle sizes
ls -lh .next/static/chunks/ | grep -E "(tsparticles|use-sound)"
```

**Target:**
- [ ] Total increase: < 150KB gzipped
- [ ] Lazy-loaded chunks visible in build output

### 3. Accessibility Testing

#### Reduced Motion
```bash
# macOS
System Settings → Accessibility → Display → Reduce motion (ON)

# Windows
Settings → Accessibility → Visual effects → Animation effects (OFF)

# Linux
Settings → Universal Access → Reduce animation (ON)
```

**Expected behavior:**
- [ ] No glitch animation
- [ ] No scanline pulse
- [ ] No particle bursts
- [ ] Static cyan glow visible (20% opacity)
- [ ] Hover still works (scale + brightness)
- [ ] No console errors

#### Keyboard Navigation
```bash
# Test with keyboard only
1. Tab to card component
2. Press Enter/Space
```

**Expected behavior:**
- [ ] Card receives visible focus ring
- [ ] Focus triggers same effects as hover
- [ ] Particle burst appears on focus
- [ ] Tab navigation smooth (no focus trap)

#### Screen Reader Testing

**macOS VoiceOver:**
```bash
Cmd + F5 to enable
VO + Right Arrow to navigate
```

**Expected:**
- [ ] Card announced as "img"
- [ ] Alt text read correctly
- [ ] No unexpected announcements from particles

**NVDA (Windows):**
```bash
Insert + Down Arrow to navigate
```

**Expected:**
- [ ] Card role and text announced
- [ ] No script errors in Speech Viewer

### 4. Cross-Browser Testing

#### Chrome/Edge (Chromium)
- [ ] Glitch animation smooth
- [ ] Particles render correctly
- [ ] CSS filters work (hue-rotate)
- [ ] No console errors

#### Firefox
- [ ] CSS variables work (`--glitch-x1`, etc.)
- [ ] Filter performance acceptable
- [ ] Particles fallback if needed
- [ ] No warnings in console

#### Safari (macOS/iOS)
- [ ] WebKit CSS support verified
- [ ] GPU acceleration working
- [ ] Mobile Safari: Touch events trigger hover
- [ ] No iOS-specific bugs

### 5. Mobile Testing

#### Responsive Design
```bash
# Chrome DevTools Device Emulation
1. Toggle device toolbar (Ctrl+Shift+M)
2. Test various devices:
   - iPhone 14 Pro
   - iPad Pro
   - Samsung Galaxy S21
```

**Expected:**
- [ ] Cards scale appropriately
- [ ] Touch events work (tap = hover)
- [ ] Particles don't overwhelm small screens
- [ ] No horizontal scroll
- [ ] Performance acceptable (30fps minimum)

#### Real Device Testing
```bash
# Test on physical devices
1. Deploy to staging/preview
2. Test on iOS + Android
```

**Critical checks:**
- [ ] No layout breaks
- [ ] Animations smooth or disabled (reduced-motion)
- [ ] Battery drain acceptable
- [ ] No crashes

### 6. Integration Testing

#### Without SoundProvider
```tsx
// Should work gracefully without context
<HoloCardImage src="/card.png" alt="Test" />
```

**Expected:**
- [ ] No errors in console
- [ ] isMuted defaults to true (safe fallback)
- [ ] Visual effects work normally

#### With SoundProvider (Future)
```tsx
<SoundProvider>
  <HoloCardImage src="/card.png" alt="Test" enableSound={true} />
</SoundProvider>
```

**Expected (when sounds added):**
- [ ] Mute toggle controls sound
- [ ] No autoplay violations
- [ ] Sound files load lazily

### 7. Edge Cases

#### Multiple Cards on Page
```tsx
{cards.map(card => (
  <HoloCardImage key={card.id} src={card.image} alt={card.name} />
))}
```

**Test with:**
- [ ] 10+ cards visible
- [ ] Rapid hover across multiple cards
- [ ] Simultaneous hover on 2+ cards

**Expected:**
- [ ] No particle ID conflicts
- [ ] Performance remains acceptable
- [ ] Memory doesn't leak (check DevTools Memory)

#### Slow Network
```bash
# Chrome DevTools Network tab
1. Throttle to "Slow 3G"
2. Reload page
```

**Expected:**
- [ ] Particles lazy-load (not initial bundle)
- [ ] Placeholder/skeleton state if needed
- [ ] No broken effects

#### Low-End Hardware
```bash
# Simulate with Chrome DevTools
1. Performance tab → CPU throttling (6x slowdown)
2. Test interactions
```

**Expected:**
- [ ] Animations may drop to 30fps (acceptable)
- [ ] No complete lockup
- [ ] Reduced-motion preferred for these users

## Automated Tests (Future)

### Unit Tests (Vitest)
```typescript
// src/components/titan/__tests__/HoloCardImage.test.tsx
describe('HoloCardImage', () => {
  it('renders with required props', () => {
    render(<HoloCardImage src="/test.png" alt="Test Card" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('disables animations with prefers-reduced-motion', () => {
    // Mock matchMedia
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    render(<HoloCardImage src="/test.png" alt="Test" />);
    // Assert no animate-holo-glitch class
  });

  it('triggers particle burst on hover', () => {
    const { container } = render(<HoloCardImage src="/test.png" alt="Test" />);
    fireEvent.mouseEnter(container.firstChild);
    // Assert particles component renders
  });
});
```

### E2E Tests (Playwright)
```typescript
// tests/holo-glitch.spec.ts
test('card glitch effect works', async ({ page }) => {
  await page.goto('/cards');
  const card = page.locator('[role="img"]').first();

  // Hover and check for particle burst
  await card.hover();
  await expect(page.locator('[id^="particles-"]')).toBeVisible();

  // Check performance
  const metrics = await page.evaluate(() => performance.getEntriesByType('navigation'));
  expect(metrics[0].duration).toBeLessThan(3000); // 3s max
});
```

## Performance Benchmarks

### Baseline (Before Enhancement)
- Bundle size: ~500KB (main chunk)
- FPS: 60fps steady
- INP: 50-100ms
- Memory: ~50MB

### Target (After Enhancement)
- Bundle size: ~550KB (+50KB for particles, lazy-loaded)
- FPS: 55-60fps (acceptable drop)
- INP: < 200ms (within Web Vitals threshold)
- Memory: ~60MB (+10MB for particles, released after burst)

### Red Flags (Fail Criteria)
- ❌ FPS < 30fps on hover
- ❌ INP > 300ms
- ❌ Bundle increase > 200KB
- ❌ Memory leak (increases indefinitely)
- ❌ Accessibility errors in Lighthouse
- ❌ Console errors on any browser

## Troubleshooting

### Issue: Particles not appearing
**Possible causes:**
1. `enableParticles={false}` set on component
2. `prefers-reduced-motion` enabled in OS
3. Particles failed to lazy-load (network error)

**Debug steps:**
```bash
# Check console for errors
console.log("Particles loaded:", particlesLoaded);

# Verify network request
DevTools → Network → Filter "tsparticles"
```

### Issue: Animations janky/laggy
**Possible causes:**
1. Too many cards rendered simultaneously
2. Other heavy scripts on page
3. Low-end hardware

**Solutions:**
- Reduce particle count (change `value: 50` to `value: 20`)
- Disable particles on mobile (`enableParticles={!isMobile}`)
- Throttle hover events

### Issue: TypeScript errors
**Known issue:**
React 18/19 type mismatch causes `SoundContext.Provider` error. This is suppressed with `@ts-expect-error` and is safe (existing codebase pattern).

**If new errors appear:**
```bash
# Check specific files
pnpm typecheck 2>&1 | grep -E "(HoloCardImage|SoundContext)"
```

## Sign-Off Checklist

Before merging:
- [ ] All visual tests pass
- [ ] Lighthouse: Performance ≥ 90, Accessibility = 100
- [ ] Reduced-motion tested (effects disabled)
- [ ] Keyboard navigation works
- [ ] No console errors (Chrome, Firefox, Safari)
- [ ] Bundle size increase < 150KB
- [ ] Documentation updated (this file + HOLO_GLITCH_IMPLEMENTATION.md)
- [ ] Code reviewed for security (no XSS, injection risks)
- [ ] Tested on staging environment

## Continuous Monitoring

### Post-Deploy Monitoring
- [ ] Vercel Analytics: Check Web Vitals dashboard
- [ ] Sentry: Monitor for runtime errors
- [ ] User feedback: Gather accessibility concerns
- [ ] Performance: Track bundle size trends

### Metrics to Watch
| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| INP | Vercel Analytics | > 300ms |
| CLS | Vercel Analytics | > 0.15 |
| JS Bundle | Vercel | > 600KB (main) |
| Error Rate | Sentry | > 1% sessions |

---
*Last updated: 2025-11-24*
*Companion to HOLO_GLITCH_IMPLEMENTATION.md*
