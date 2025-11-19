# APEX INTELLIGENCE — 18-SECOND CINEMATIC TRAILER
## Production Bible v1.0

**Mission**: Create the single greatest 18-second cinematic trailer in TCG history
**Deadline**: 48 hours
**Platforms**: X, LinkedIn, Instagram Reels, TikTok, Discord
**Launch Date**: November 20, 2025

---

## 🎬 MASTER SHOT LIST — FRAME-BY-FRAME BREAKDOWN

### ACT I: THE ASCENSION (0:00 - 0:08)
**Sound**: Rising tension, building bass, heartbeat rhythm

#### SHOT 1: PORTFOLIO EXPLOSION (0:00 - 0:03)
**Duration**: 3 seconds
**Timing**: 0:00.000 → 0:03.000

**Visual Elements**:
- **Background**: Deep ink (#0a0e1a) with Aurora FX cyan/purple tides drifting slowly
- **Center Focus**: Massive portfolio value counter
  - Starting value: `$127,431` (faded, ghosted)
  - Ending value: `$428,901` (BLAZING cyan glow)
  - Animation: Rapid numerical ticker from start → end (2.5s duration)
  - Typography: 120pt Geist Mono, bold, cyan (#00FFFF) with 40px outer glow
  - Position: Center frame, slightly above middle

**Text Overlay**:
- 0:00.500 → "$428,901" fades in (0.3s)
- Counter animates up with micro shake on each digit flip
- Final frame: Hold on $428,901 with pulsing glow (0.5s hold)

**Camera Movement**:
- Slow push-in zoom (110% → 120% scale over 3s)
- Subtle Y-axis drift upward (+20px)

**Data Source**: Mock portfolio data (reference: /api/portfolio/pnl endpoint structure)

---

#### SHOT 2: THE TIMELINE REVEAL (0:03 - 0:06)
**Duration**: 3 seconds
**Timing**: 0:03.000 → 0:06.000

**Visual Elements**:
- **Transition**: Portfolio number scales down to top-right corner (0.4s)
- **New Element**: Timeline text appears center-bottom
  - Text: `"in 11 months"`
  - Typography: 64pt Geist Sans, regular weight
  - Color: White (#FFFFFF) → Cyan gradient (#00FFFF)
  - Animation: Letter-by-letter reveal with stagger (0.08s per letter)
  - Position: Lower third, centered

**Background Shift**:
- Starfield activates (150 stars, 60% cyan / 40% purple)
- Stars pulse in sync with heartbeat rhythm
- Aurora FX intensifies saturation (+20%)

**Camera Movement**:
- Continue slow zoom (120% → 125%)
- Begin subtle rotation (+2° clockwise)

---

#### SHOT 3: THE ULTIMATUM (0:06 - 0:08)
**Duration**: 2 seconds
**Timing**: 0:06.000 → 0:08.000

**Visual Elements**:
- **Hard Cut Transition**: All previous elements dissolve to black (0.2s)
- **Center Text Block**:
  ```
  You are late.
  ```
  - Typography: 72pt Geist Mono, medium weight
  - Color: Deep red (#FF3B3B) with crimson glow
  - Animation: Snap-in from scale 80% → 100% with elastic bounce
  - Duration: Hold 1s

- **0:07.000 Mark**: Text shifts/morphs
  - "late" crosses out with red strike-through (0.15s)
  - Text transforms to:
  ```
  You are early.
  ```
  - "early" appears in electric cyan (#00FFFF) with lightning glow
  - Animation: Glitch effect (RGB split, 3-frame distortion)

**Background**:
- Pure black (#000000)
- Single spotlight on text (radial gradient from center)
- Subtle grid pattern overlay (20% opacity, cyan)

**Sound Sync Point**:
- **0:08.000 — BASS DROP HIT** (perfectly timed)

---

### ACT II: THE REVELATION (0:08 - 0:16)
**Sound**: Bass-heavy, aggressive synth, war drums

#### SHOT 4: DATA ONSLAUGHT (0:08 - 0:12)
**Duration**: 4 seconds
**Timing**: 0:08.000 → 0:12.000

**Visual Elements** (3-panel rapid montage):

**Panel A (0:08.000 - 0:09.333)**:
- **Element**: Arbitrage Scanner — Live Detection
- **Layout**:
  - Left side: Flash-red alert box
    - Text: `"ARBITRAGE DETECTED"`
    - Subtext: `"$47,230 spread"`
  - Right side: Card thumbnail (mock Charizard image)
  - Center: Animated line graph showing price delta
    - Red line (eBay): $89,000
    - Green line (Mercari JP): $41,770
    - Profit zone highlighted in cyan
- **Animation**:
  - Red→Green flash pulse (0.15s)
  - Numbers count up from $0 → $47,230 (1s)
  - Graph draws in from left to right (1.2s)
- **Background**: Dark card grid pattern with cyan glow trails

**Panel B (0:09.333 - 0:10.667)**:
- **Element**: Umbreon VMAX Alt Art — Moonshot Graph
- **Layout**:
  - Full-frame area chart (reference: AreaChartViz component)
  - Data line: Explosive curve Oct 2025 → Nov 2025
  - Starting point: $340 (Oct 15)
  - Peak point: $1,180 (Nov 12)
  - Annotation: `"+247% in 28 days"`
- **Animation**:
  - Graph draws in real-time with trailing cyan glow
  - Y-axis scales dynamically (logarithmic ease)
  - Peak point pulses with "burst" particle effect (50 cyan particles)
  - Background moon breathing effect (subtle radial gradient pulse)
- **Color Scheme**:
  - Line: Cyan (#00FFFF) 3px stroke
  - Fill: Cyan gradient (35% opacity top → 0% bottom)
  - Grid: Purple (#9333ea) 1px, 15% opacity
- **Data Source**: Custom JSON array
  ```json
  [
    ["2025-10-15", 340],
    ["2025-10-22", 385],
    ["2025-10-29", 520],
    ["2025-11-05", 890],
    ["2025-11-12", 1180]
  ]
  ```

**Panel C (0:10.667 - 0:12.000)**:
- **Element**: 3D Rotating Scatter Plot — Pokémon 151 Set
- **Layout**:
  - 3D scatter plot (reference: LiveScatter component but elevated)
  - Axes:
    - X: Popularity Score (0-100)
    - Y: Price ($0-$900)
    - Z: PSA 10 Population (bubble size)
  - Data points: 20 cards from Pokémon 151 set
  - **Hero Point**: Charizard SAR
    - Position: X=95, Y=$875, Z=2,400 (large bubble)
    - Color: Blazing orange-cyan gradient
    - Label: "Charizard SAR — $875"
- **Animation**:
  - Plot rotates 360° over 1.3s (Y-axis rotation)
  - Charizard point zooms in and locks center (0.5s)
  - Camera orbits around locked point
  - Other points blur with depth-of-field effect
- **Background**: 3D grid cube (wireframe, cyan/purple)

**Transition Between Panels**:
- Hard cuts with 2-frame white flash (subliminal)
- Audio: Sharp "swoosh" sound on each cut

---

#### SHOT 5: BRAND LOCKUP (0:12 - 0:14)
**Duration**: 2 seconds
**Timing**: 0:12.000 → 0:14.000

**Visual Elements**:
- **Transition**: Data montage dissolves to black (0.3s)
- **Center Element**: Brand name reveal
  ```
  APEX INTELLIGENCE
  ```
  - Typography: 84pt Geist Sans, bold
  - Color: White → Cyan/Purple gradient (animated gradient shift)
  - Animation: Letter-by-letter build from center outward
    - "INTELLIGENCE" appears first (bottom)
    - "APEX" drops in from above (0.2s after)
  - Spacing: 2px letter-spacing, 20px word gap
  - Position: Perfect center

**Background**:
- Aurora Borealis FX at maximum intensity
- Neon squares floating in background (6 squares, slow rotation)
- Subtle holographic shimmer overlay (rainbow refraction)

**Secondary Elements**:
- Thin cyan line draws horizontally under "INTELLIGENCE" (0.4s)
- Small subtitle fades in below:
  - Text: `"Trading Card Intelligence Platform"`
  - Typography: 24pt Geist Sans, light weight
  - Color: 60% white opacity
  - Timing: 0:13.500

---

### ACT III: THE PROCLAMATION (0:14 - 0:18)
**Sound**: Bass sustain, cinematic riser, silence cut

#### SHOT 6: WOLF REVEAL + TAGLINE (0:14 - 0:18)
**Duration**: 4 seconds
**Timing**: 0:14.000 → 0:18.000

**Visual Elements**:

**Phase 1 — Wolf Assembly (0:14.000 - 0:16.000)**:
- **Element**: Geometric wolf logo (/public/wolf-logo.png)
- **Animation**:
  - Logo starts as scattered geometric fragments (120 pieces)
  - Fragments drift in 3D space (depth parallax)
  - 0:14.500 → Fragments snap together with magnetic effect
  - Assembly completes by 0:15.500
  - Final logo: 600px height, center frame
- **Color Treatment**:
  - Left side: Cyan (#00FFFF) with electric glow
  - Right side: Purple (#9333ea) with soft glow
  - Center line: White (#FFFFFF) highlight
  - Outer glow: 60px radial, 40% opacity cyan-purple gradient
- **Background**:
  - Deep space black (#000000)
  - Distant stars (subtle, out of focus)
  - Horizontal cyan scan line passes across logo (0:15.800)

**Phase 2 — Tagline Drop (0:16.000 - 0:18.000)**:
- **Element**: Final tagline
  ```
  The hunt is over.
  ```
  - Typography: 56pt Geist Mono, medium weight
  - Color: Pure white (#FFFFFF) with cyan underline
  - Animation:
    - Fades in below wolf logo (0.4s fade)
    - Slight upward drift (+10px)
    - Final position: 140px below logo center
  - Timing: Appears at 0:16.200

**Camera Movement**:
- Slow zoom out (100% → 95% scale) — "reveal the full picture"
- Stabilize and lock at 0:17.500

**Final Frame (0:17.500 - 0:18.000)**:
- Hold on complete composition
- Subtle breathing animation (logo scales 100% → 102% → 100%, 2s loop)
- Tagline remains static
- Audio: Final bass note sustain → hard cut to silence at 0:18.000

---

### FADE OUT (0:18 - 0:19)
**Duration**: 1 second
**Timing**: 0:18.000 → 0:19.000

- Entire composition fades to black (0.8s)
- Final frame: Pure black with subtle cyan pixel noise (0.2s)
- **End Card** (optional for YouTube/TikTok):
  - Small text: `"apexintelligence.center"` (18pt, 60% white)
  - Position: Bottom center, 40px from edge
  - Timing: 0:18.500 → 0:19.000

---

## 🎨 AFTER EFFECTS PROJECT STRUCTURE

### File Organization
```
Apex_Intelligence_Trailer_18s_v1.aep
│
├── 📁 COMPS
│   ├── [MASTER] 9x16_Vertical_Main (1080x1920, 60fps, 19s)
│   ├── [MASTER] 16x9_Horizontal_Main (1920x1080, 60fps, 19s)
│   │
│   ├── 01_Portfolio_Explosion (0-3s)
│   ├── 02_Timeline_Reveal (3-6s)
│   ├── 03_Ultimatum (6-8s)
│   ├── 04_Data_Onslaught (8-12s)
│   │   ├── 04a_Arbitrage_Panel (8-9.33s)
│   │   ├── 04b_Umbreon_Moonshot (9.33-10.67s)
│   │   └── 04c_3D_Scatter (10.67-12s)
│   ├── 05_Brand_Lockup (12-14s)
│   ├── 06_Wolf_Reveal (14-18s)
│   └── 07_Fade_Out (18-19s)
│
├── 📁 ASSETS
│   ├── Logos
│   │   └── wolf-logo.png (1284x1284, transparent PNG)
│   ├── Data_Visualizations
│   │   ├── umbreon_price_data.json
│   │   ├── scatter_plot_data.json
│   │   └── arbitrage_mockup.png
│   ├── Textures
│   │   ├── starfield_particles.mp4 (pre-rendered)
│   │   ├── aurora_fx.mp4 (pre-rendered)
│   │   └── grid_pattern.png (tileable, 100x100px)
│   └── Typography
│       ├── GeistMono-Bold.otf
│       └── GeistSans-Bold.otf
│
├── 📁 AUDIO
│   └── apex_trailer_master_v1.wav (stereo, 48kHz, 24-bit)
│
├── 📁 RENDER_QUEUE
│   ├── 9x16_Vertical_Final.mov (ProRes 4444, 60fps)
│   ├── 16x9_Horizontal_Final.mov (ProRes 4444, 60fps)
│   ├── 9x16_Vertical_Web.mp4 (H.264, 60fps, 20Mbps)
│   └── 16x9_Horizontal_Web.mp4 (H.264, 60fps, 20Mbps)
│
└── 📁 PRECOMPS
    ├── BG_Aurora_Loop (10s loop, seamless)
    ├── BG_Starfield_Loop (10s loop, seamless)
    ├── FX_Number_Counter (reusable expression)
    ├── FX_Glitch_RGB_Split (adjustment layer)
    └── FX_Holographic_Shimmer (overlay)
```

---

## 🎯 LAYER ARCHITECTURE (9x16 Master Comp)

### Shot 1: Portfolio Explosion (Comp 01)
```
Layers (top to bottom):
├── Text: "$428,901" [Geist Mono Bold, 120pt, Cyan]
│   ├── Effect: Glow (40px, cyan)
│   ├── Effect: CC Light Burst 2.5 (subtle)
│   └── Expression: Counter animation (0-3s)
│       Code:
│       startValue = 127431;
│       endValue = 428901;
│       duration = 2.5;
│       if (time < duration) {
│         Math.floor(linear(time, 0, duration, startValue, endValue));
│       } else {
│         endValue;
│       }
│
├── Adjustment Layer: Camera Push
│   └── Transform: Scale from 110% to 120% (3s ease out)
│
├── BG: Aurora FX [Precomp, blend mode: Screen]
├── BG: Solid #0a0e1a (ink background)
```

### Shot 3: The Ultimatum (Comp 03)
```
Layers:
├── Text: "You are early." [Geist Mono, 72pt, Cyan]
│   ├── Effect: Glow (30px, cyan electric)
│   ├── Animator: Opacity 0→100% at 7.0s
│   └── Animator: Glitch (4-frame RGB split at 7.0s)
│
├── Text: "You are late." [Geist Mono, 72pt, Red]
│   ├── Effect: Glow (30px, crimson)
│   ├── Animator: Strike-through line (draws at 7.0s)
│   └── Animator: Opacity 100→0% at 7.15s
│
├── Adjustment Layer: FX_Glitch_RGB_Split [Disabled until 7.0s]
│   ├── Effect: Channel Blur (R: +5px, G: 0, B: -5px)
│   └── Effect: Posterize Time (12fps for stutter)
│
├── BG: Grid Pattern [Cyan, 20% opacity]
├── BG: Radial Gradient (Center spotlight)
├── BG: Solid #000000 (pure black)
```

### Shot 4b: Umbreon Moonshot Graph (Comp 04b)
```
Layers:
├── Shape Layer: Price Line [Cyan #00FFFF, 3px stroke]
│   ├── Path: 5 keyframes matching data points
│   ├── Trim Paths: 0% to 100% over 1.2s (animate draw-in)
│   └── Effect: Glow (10px, cyan)
│
├── Shape Layer: Fill Area [Cyan gradient]
│   ├── Fill: Linear gradient (35% top → 0% bottom)
│   └── Mask: Follows price line path
│
├── Shape Layer: Peak Burst Particles [50 particles]
│   ├── Particle System: CC Particle World
│   ├── Birth: 10.5s, Death: 11.0s
│   ├── Color: Cyan → White fade
│   └── Velocity: Radial explosion from peak point
│
├── Text: "+247% in 28 days" [Geist Sans, 32pt]
│   ├── Position: Near peak point (offset +60px right)
│   └── Animator: Fade in at 10.2s
│
├── Shape Layer: Y-Axis Grid [Purple, 1px, 15% opacity]
├── Shape Layer: X-Axis Grid [Purple, 1px, 15% opacity]
│
├── Adjustment Layer: Moon Breathing Effect
│   ├── Effect: Radial Gradient (center, purple glow)
│   ├── Animator: Scale 100% → 105% → 100% (2s loop)
│   └── Blend Mode: Add
│
├── BG: Solid #0a0e1a
```

### Shot 6: Wolf Reveal (Comp 06)
```
Layers:
├── Text: "The hunt is over." [Geist Mono, 56pt, White]
│   ├── Effect: Glow (20px, cyan tint)
│   ├── Position: Center X, 60% Y (below logo)
│   └── Animator: Fade in 0→100% (16.0s - 16.4s)
│
├── Shape Layer: Cyan Underline
│   ├── Stroke: 2px, cyan
│   ├── Trim Paths: 0% to 100% (16.2s - 16.5s)
│   └── Position: 10px below text baseline
│
├── Graphic: Wolf Logo [PNG, 600px height]
│   ├── Effect: Separate RGB (for fragment animation)
│   ├── Effect: CC Sphere (3D depth, disabled after assembly)
│   ├── Animator: Fragment Explosion [14.0s - 15.5s]
│   │   Method: Shatter effect with 120 pieces
│   │   Physics: Drift in 3D space with depth
│   │   Assembly: Reverse animation with magnetic snap
│   └── Effect: Glow (60px, cyan-purple gradient)
│       Stop 1: Cyan #00FFFF (left)
│       Stop 2: Purple #9333ea (right)
│
├── Shape Layer: Scan Line [Horizontal, 2px, cyan]
│   ├── Position: Animates Y from -100px to +700px (15.5s - 16.0s)
│   ├── Opacity: 80%
│   └── Blend Mode: Add
│
├── Adjustment Layer: Camera Zoom Out
│   └── Transform: Scale 100% to 95% (14.0s - 17.5s, ease out)
│
├── Particle Layer: Distant Stars [100 particles, defocused]
│   ├── Size: 2-4px
│   ├── Color: White, 30% opacity
│   └── Z-depth: -2000px (far background)
│
├── BG: Solid #000000
```

---

## 📊 DATA SOURCES & INTEGRATION

### Real Data Points (November 18-19, 2025)

#### 1. Portfolio Value Explosion
**Source**: Mock realistic portfolio data
```javascript
// Portfolio snapshot
{
  "startDate": "2025-01-01",
  "startValue": 127431,
  "endDate": "2025-11-18",
  "endValue": 428901,
  "totalReturn": 236.5%, // percentage
  "duration": 322, // days
  "cagr": 68.4%
}
```

#### 2. Arbitrage Spread Detection
**Source**: Mock based on /api/arbitrage/live endpoint structure
```javascript
{
  "card": "Charizard Base Set 1st Edition PSA 10",
  "platform1": {
    "name": "eBay US",
    "price": 89000,
    "url": "https://ebay.com/..."
  },
  "platform2": {
    "name": "Mercari JP",
    "price": 41770,
    "url": "https://mercari.jp/..."
  },
  "spread": 47230,
  "spreadPercent": 53.1,
  "riskScore": 6.2,
  "confidenceLevel": "HIGH"
}
```

#### 3. Umbreon VMAX Alt Art Price Data
**Source**: Custom JSON array (realistic market movement)
```json
{
  "card": "Umbreon VMAX Alternate Art (SWSH Evolving Skies)",
  "grading": "PSA 10",
  "currency": "USD",
  "timeframe": "Oct 15 - Nov 12, 2025",
  "dataPoints": [
    {"date": "2025-10-15", "price": 340, "volume": 12},
    {"date": "2025-10-22", "price": 385, "volume": 18},
    {"date": "2025-10-29", "price": 520, "volume": 34},
    {"date": "2025-11-05", "price": 890, "volume": 67},
    {"date": "2025-11-12", "price": 1180, "volume": 92}
  ],
  "percentIncrease": 247.1,
  "catalyst": "PokéPost viral grading reveal + Japanese restock rumors"
}
```

#### 4. Pokémon 151 3D Scatter Plot Data
**Source**: Mock set analysis (realistic card values)
```json
{
  "setName": "Pokémon 151 (Scarlet & Violet)",
  "releaseDate": "2023-09-22",
  "dataDate": "2025-11-18",
  "cards": [
    {
      "name": "Charizard ex SAR",
      "number": "199/165",
      "popularityScore": 95,
      "price": 875,
      "psaPopulation": 2400
    },
    {
      "name": "Pikachu ex SAR",
      "number": "192/165",
      "popularityScore": 88,
      "price": 340,
      "psaPopulation": 1850
    },
    {
      "name": "Mewtwo ex SAR",
      "number": "194/165",
      "popularityScore": 82,
      "price": 290,
      "psaPopulation": 1420
    },
    // ... 17 more cards with varying stats
  ]
}
```

### Data Visualization Techniques

#### Technique 1: Counter Animation (After Effects Expression)
```javascript
// Apply to text layer "sourceText" property
startVal = 127431;
endVal = 428901;
duration = 2.5; // seconds

if (time < duration) {
  currentVal = Math.floor(linear(time, 0, duration, startVal, endVal));
} else {
  currentVal = endVal;
}

// Format with commas
currentVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// Output: "428,901"
```

#### Technique 2: Graph Draw-In (Trim Paths)
```javascript
// Shape layer: Trim Paths "End" property
duration = 1.2;
if (time < duration) {
  linear(time, 0, duration, 0, 100); // 0% to 100%
} else {
  100;
}
```

#### Technique 3: 3D Scatter Plot Rotation
```javascript
// Camera: Y Rotation property
startTime = 10.67; // shot start
duration = 1.3;
rotations = 1; // full 360°

if (time >= startTime && time < startTime + duration) {
  linear(time, startTime, startTime + duration, 0, 360 * rotations);
} else if (time >= startTime + duration) {
  360 * rotations;
} else {
  0;
}
```

---

## 🔊 SOUND DESIGN SPECIFICATION

### Audio Architecture

**Master Track**: 18 seconds, Stereo, 48kHz, 24-bit

#### Layered Sound Design:

**Layer 1: Bass Foundation**
- 0:00 - 0:08: Sub-bass riser (40Hz - 80Hz)
  - Crescendo from -24dB to -6dB
  - Filter sweep: Low-pass 200Hz → 800Hz
- 0:08: BASS DROP (peak at -3dB)
  - Frequency: 55Hz fundamental
  - Waveform: Sine + slight distortion
  - Decay: 0.5s sustain, 1.5s release
- 0:08 - 0:18: Bass sustain and rumble
  - Maintain 55Hz-80Hz range
  - Sidechain compression against drums
  - Final hit at 0:18 (hard cut to silence)

**Layer 2: Rhythmic Elements**
- 0:00 - 0:08: Heartbeat rhythm
  - Tempo: 80 BPM
  - Kick: Muffled, filtered (500Hz low-pass)
  - Pattern: Kick on 1 and 3, subtle snare on 2 and 4
- 0:08 - 0:12: War drums
  - Tempo: 140 BPM (double-time feel)
  - Pattern: Tribal toms, aggressive hits
  - Reverb: Large hall (2.5s decay)
- 0:12 - 0:18: Minimal percussion
  - Hi-hat rolls (subtle)
  - Cymbal swells (background texture)

**Layer 3: Melodic/Atmospheric**
- 0:00 - 0:06: Tension riser
  - Synth pad: Detuned oscillators, minor key
  - Pitch: Rising from C2 to C4 over 6s
  - Effect: Heavy reverb + delay
- 0:06 - 0:08: Silence break (dramatic pause)
  - All melodic elements cut
  - Only heartbeat rhythm remains (faint)
- 0:08 - 0:14: Aggressive synth lead
  - Waveform: Sawtooth with filter modulation
  - Melody: Short staccato notes, rhythmic
  - Key: D minor (aggressive, dark)
- 0:14 - 0:18: Cinematic riser + resolution
  - String ensemble (synthetic)
  - Crescendo into final bass note
  - Resolves to D major (hopeful shift)

**Layer 4: Sound FX**
- 0:03: Glitch stutter (data reveal)
- 0:06: Record scratch / reverse cymbal
- 0:07: Glitch effect (RGB split sync)
- 0:08: Impact hit (bass drop accent)
- 0:08, 0:09.33, 0:10.67: "Swoosh" transitions (data panels)
- 0:12: Whoosh (brand reveal)
- 0:14: Scatter/assembly sounds (wolf fragments)
- 0:15.5: Lock/snap sound (logo completes)
- 0:16: Subtle chime (tagline appears)
- 0:18: Silence cut (abrupt, clean)

### Exact Timing Sync Points (Critical)

| Time | Sound Event | Visual Sync |
|------|-------------|-------------|
| 0:00.000 | Bass riser starts | Portfolio counter begins |
| 0:03.000 | Glitch stutter | Timeline text appears |
| 0:06.000 | Record scratch | "You are late" appears |
| 0:07.000 | Glitch effect | Text transforms to "early" |
| **0:08.000** | **BASS DROP** | **Data onslaught begins** |
| 0:09.330 | Swoosh 1 | Panel A → B transition |
| 0:10.670 | Swoosh 2 | Panel B → C transition |
| 0:12.000 | Whoosh | Brand name reveal |
| 0:14.000 | Scatter SFX | Wolf fragments start |
| 0:15.500 | Lock/snap | Wolf logo completes |
| 0:16.200 | Subtle chime | Tagline fades in |
| 0:18.000 | Silence cut | Fade to black begins |

### Recommended Sound Sources

**Option 1: Royalty-Free Libraries**
- **Artlist.io**: Search "cinematic bass drop trailer"
  - Track suggestion: "War Drums" by Johannes Bornlöf
  - Track suggestion: "Digital Tension" by Igor Khainskyi
- **Epidemic Sound**: Search "aggressive synth trailer"
  - Track suggestion: "The Hunt" by Rage Sound
- **AudioJungle**: "Cinematic Trailer Impact Logo"
  - Item ID: 25683902 (example)

**Option 2: Custom Production**
- DAW: Ableton Live or Logic Pro X
- VST Synths:
  - Serum (bass, leads, FX)
  - Omnisphere (pads, atmospheres)
  - Kontakt (drums, orchestral elements)
- Mixing:
  - Sidechain compression on all elements to bass/kick
  - Multiband compression on master (tight low-end)
  - Limiting: -0.3dB ceiling (avoid clipping)
  - Reference level: -14 LUFS integrated (for social media)

**Option 3: YouTube Audio Library (Free)**
- Search: "epic cinematic bass"
- Filter: Duration < 30s, Mood: Dark/Intense
- Suggested track: "End Game" by Per Kiilstofte
  - Timestamp: 0:00 - 0:18 (trim to fit)
  - License: Free to use with attribution

### Audio Export Settings
```
Format: WAV (uncompressed)
Sample Rate: 48000 Hz
Bit Depth: 24-bit
Channels: Stereo
Normalization: Peak at -0.3dB
Fade Out: 0.5s (17.5s - 18.0s)
```

---

## 🎥 EXPORT SETTINGS & DELIVERABLES

### Primary Deliverable: 9:16 Vertical (Instagram/TikTok/Reels)

#### After Effects Render Settings
```
Composition: [MASTER] 9x16_Vertical_Main
Format: QuickTime (ProRes 4444 for lossless quality)

Video:
  - Codec: Apple ProRes 4444
  - Resolution: 1080 x 1920 (9:16 aspect ratio)
  - Frame Rate: 60 fps
  - Pixel Aspect Ratio: Square Pixels (1.0)
  - Field Order: Progressive
  - Color Depth: 8-bit + Alpha (if transparent bg needed)
  - Color Profile: Rec. 709

Audio:
  - Codec: Linear PCM
  - Sample Rate: 48 kHz
  - Bit Depth: 24-bit
  - Channels: Stereo

Duration: 0:00:00:00 - 0:00:19:00 (19 seconds at 60fps = 1140 frames)
```

#### Media Encoder Export (Social Media Optimized)
```
Format: H.264

Video:
  - Bitrate Encoding: VBR, 2 pass
  - Target Bitrate: 20 Mbps
  - Maximum Bitrate: 25 Mbps
  - Resolution: 1080 x 1920
  - Frame Rate: 60 fps (maintain)
  - Profile: High
  - Level: 4.2
  - Keyframe Distance: 30 frames (0.5s)

Audio:
  - Codec: AAC
  - Bitrate: 320 kbps (high quality)
  - Sample Rate: 48 kHz
  - Channels: Stereo

Advanced:
  - Render at Maximum Depth: ON
  - Use Maximum Render Quality: ON
  - Time Interpolation: Frame Sampling
```

**File Output**: `Apex_Trailer_9x16_60fps_v1.mp4`
**Estimated File Size**: ~45-55 MB

---

### Secondary Deliverable: 16:9 Horizontal (X/LinkedIn/YouTube Shorts)

#### After Effects Render Settings
```
Composition: [MASTER] 16x9_Horizontal_Main
Format: QuickTime (ProRes 4444)

Video:
  - Codec: Apple ProRes 4444
  - Resolution: 1920 x 1080 (16:9 aspect ratio)
  - Frame Rate: 60 fps
  - Pixel Aspect Ratio: Square Pixels (1.0)
  - Field Order: Progressive
  - Color Depth: 8-bit + Alpha

Audio: [Same as 9:16 version]

Duration: 0:00:00:00 - 0:00:19:00
```

#### Composition Adaptation Notes
For 16:9 version, adjust layout:
- **Text elements**: Scale to 85% size, reposition for wider frame
- **Wolf logo**: Maintain size, center horizontally
- **Data panels**: Expand to use full width (add breathing room)
- **Background elements**: Extend Aurora/Starfield to 1920px width

#### Media Encoder Export
```
Format: H.264
[Same settings as 9:16, but resolution: 1920 x 1080]
Target Bitrate: 18 Mbps
Maximum Bitrate: 22 Mbps
```

**File Output**: `Apex_Trailer_16x9_60fps_v1.mp4`
**Estimated File Size**: ~42-50 MB

---

### Platform-Specific Optimization

#### Instagram Reels
- **Format**: 9:16, H.264, MP4
- **Max Duration**: 90s (18s is perfect)
- **Recommended**: 1080x1920, 30fps minimum (60fps supported)
- **Max File Size**: 650 MB (we're well under)
- **Audio**: AAC, 128 kbps minimum (we use 320 kbps)
- **Upload**: Direct from desktop or mobile (maintain quality)

#### TikTok
- **Format**: 9:16, H.264, MP4
- **Max Duration**: 10 minutes (18s is ideal)
- **Recommended**: 1080x1920, 30-60fps
- **Max File Size**: 287.6 MB (Android), 500 MB (iOS)
- **Audio**: AAC, 128-320 kbps
- **Aspect Ratio**: 9:16 for maximum screen coverage

#### X (Twitter)
- **Format**: 16:9 or 1:1, H.264, MP4
- **Max Duration**: 2:20 (140s)
- **Recommended**: 1920x1080 or 1080x1920, 60fps
- **Max File Size**: 512 MB
- **Bitrate**: Maximum 25 Mbps (we're at 20-22 Mbps)
- **Audio**: AAC, 320 kbps supported
- **Note**: Upload 16:9 version for desktop timeline prominence

#### LinkedIn
- **Format**: 16:9 or 1:1 preferred, H.264, MP4
- **Max Duration**: 10 minutes
- **Recommended**: 1920x1080, 30fps (60fps works but less common)
- **Max File Size**: 5 GB (way over what we need)
- **Aspect Ratio**: 16:9 for professional feed appearance
- **Upload**: 16:9 version with captions (LinkedIn autoplays muted)

#### Discord
- **Format**: Any, but MP4 recommended
- **Max File Size**: 50 MB (Nitro Basic), 500 MB (Nitro)
- **Solution**: Upload 9:16 version (45-55 MB) — fits in Nitro Basic
- **Alternative**: Host on Streamable/YouTube and share link
- **Recommendation**: Use 16:9 version at lower bitrate (15 Mbps) to fit 50 MB limit

---

### Backup Deliverables (Optional)

#### 1. GIF Preview (First 6 seconds)
- **Tool**: Adobe Media Encoder or Photoshop
- **Resolution**: 540 x 960 (half-res 9:16)
- **Frame Rate**: 24 fps
- **Duration**: 0:00 - 0:06 (teaser loop)
- **Dithering**: Diffusion
- **Colors**: 256
- **File Size**: Target < 5 MB
- **Use Case**: Email signature, Discord embed preview

#### 2. Static Thumbnail (End Frame)
- **Source**: Frame at 0:17.500 (wolf + tagline final hold)
- **Resolution**: 1080 x 1920 (PNG, 24-bit RGB)
- **File Size**: ~800 KB
- **Use Case**: YouTube thumbnail, social media posts

#### 3. Captions/Subtitles File (SRT)
```
1
00:00:00,500 --> 00:00:03,000
$428,901

2
00:00:03,000 --> 00:00:06,000
in 11 months

3
00:00:06,000 --> 00:00:08,000
You are late.
Or you are early.

4
00:00:12,000 --> 00:00:14,000
APEX INTELLIGENCE

5
00:00:16,200 --> 00:00:18,000
The hunt is over.
```
**File**: `apex_trailer_captions.srt`
**Use Case**: Accessibility, LinkedIn/YouTube uploads

---

## 🎨 MOTION DESIGN RULES & PRINCIPLES

### Camera Language
1. **Slow Zoom-In (0:00 - 0:08)**: Builds tension, draws viewer into data
2. **Rapid Cuts (0:08 - 0:12)**: Information overload, data chaos
3. **Slow Zoom-Out (0:14 - 0:18)**: "Reveal the truth", ascension
4. **Static Lock (0:17.5 - 0:18)**: Stability, confidence, arrival

### Color Psychology
- **Cyan (#00FFFF)**: Technology, precision, intelligence, future
- **Purple (#9333ea)**: Luxury, premium, mystery, power
- **Red (#FF3B3B)**: Urgency, loss, danger, FOMO ("late")
- **White (#FFFFFF)**: Clarity, truth, arrival, resolution
- **Black (#000000)**: Depth, sophistication, focus

### Typography Hierarchy
- **Primary (Data Values)**: Geist Mono Bold, 84-120pt — Commands attention
- **Secondary (Body Text)**: Geist Sans Regular, 56-72pt — Readable, modern
- **Tertiary (Labels)**: Geist Sans Light, 24-32pt — Subtle context

### Animation Timing (Disney's 12 Principles Applied)
1. **Ease In/Out**: All movements use bezier curves (no linear)
2. **Anticipation**: Elements scale down 5% before scaling up (0.1s)
3. **Follow-Through**: Text drifts +10px after landing (0.2s overshoot)
4. **Slow In/Slow Out**: Critical for camera moves (60% ease at both ends)
5. **Secondary Action**: Background elements move at 60% speed of foreground

### Glitch Effect Recipe (Shot 3 at 0:07)
```
Duration: 4 frames (0.067s at 60fps)
RGB Channel Split:
  - Red: +5px X-offset
  - Green: 0px (no offset)
  - Blue: -5px X-offset
Posterize Time: 12fps (stuttery look)
Opacity Flicker: 100% → 60% → 100% → 80% → 100%
```

### Particle Systems
- **Umbreon Peak Burst**: 50 particles, 0.5s lifespan, radial velocity
- **Wolf Fragments**: 120 geometric pieces, 1.5s assembly time
- **Starfield**: 150 stars, infinite loop, parallax depth

---

## 💎 PRODUCTION ASSETS CHECKLIST

### Required Assets (Must Create/Source)

- [ ] **Wolf Logo PNG** (1284x1284, transparent) — ✅ Already exists at /public/wolf-logo.png
- [ ] **Umbreon Card Image** (reference thumbnail) — Source from TCGPlayer or eBay
- [ ] **Charizard Card Image** (for arbitrage panel) — Source from PSA website
- [ ] **Font Files**:
  - [ ] Geist Mono (Bold, Medium) — Check if included in project
  - [ ] Geist Sans (Bold, Regular, Light) — Check if included
- [ ] **Audio Track** (18s, master mix) — Artlist/Epidemic or custom production
- [ ] **Aurora FX Video** (10s loop, 1920x1080) — Create in AE or source stock
- [ ] **Starfield Video** (10s loop, 1920x1080) — Create in AE
- [ ] **Grid Texture PNG** (100x100px tileable, cyan) — Create in Photoshop

### Optional Enhancements
- [ ] **3D Wolf Model** (for advanced fragment effect) — Blender export
- [ ] **Real Card Photography** (if budget allows) — Professional TCG photos
- [ ] **Motion Capture Data** (for organic camera shake) — Plugin like AE Wiggle
- [ ] **Color LUT** (cinematic grade) — Custom .cube file for consistency

---

## 🚀 PRODUCTION TIMELINE (48-Hour Sprint)

### Hour 0-6: Pre-Production
- [x] Finalize shot list and timing
- [ ] Source/create all assets (fonts, images, audio)
- [ ] Set up After Effects project structure
- [ ] Create color palette swatches and style guide

### Hour 6-18: Animation Production
- [ ] Build all 7 shot compositions
- [ ] Animate portfolio counter and text reveals
- [ ] Create data visualization graphs (Umbreon, scatter plot)
- [ ] Design and animate wolf logo fragment reveal
- [ ] Apply glitch effects and transitions

### Hour 18-24: Sound Design & Sync
- [ ] Import audio track into AE
- [ ] Sync all visual hits to audio cues (especially 0:08 bass drop)
- [ ] Add sound effect markers
- [ ] Fine-tune timing (frame-by-frame precision)

### Hour 24-36: Refinement & Polish
- [ ] Color grading (ensure cyan/purple balance)
- [ ] Add glow effects and atmospheric layers
- [ ] Optimize particle systems and background loops
- [ ] Test export at full resolution (quality check)

### Hour 36-42: Rendering & Export
- [ ] Render 9:16 ProRes master
- [ ] Render 16:9 ProRes master
- [ ] Encode H.264 versions for social media
- [ ] Create GIF preview and thumbnail

### Hour 42-48: Final Delivery & Review
- [ ] Review all exports (no glitches, audio sync perfect)
- [ ] Upload test versions to private accounts
- [ ] Gather feedback and make micro-adjustments if needed
- [ ] Prepare final uploads for November 20, 2025 launch

---

## 📝 DIRECTOR'S NOTES

### Creative Intent
This trailer is not about explaining features—it's about **invoking envy**.

Viewers should feel:
1. **FOMO** (0:00-0:08): "I missed the boat"
2. **Hope** (0:08): "Wait, maybe I didn't"
3. **Awe** (0:08-0:14): "This is insane, I need this"
4. **Resolution** (0:14-0:18): "I must join the hunt"

### Reference Energy
- **Isaiah Taylor's video**: Fast cuts, bass-heavy, data as hero
- **Steven Sarmi's video**: Charts that breathe, numbers that pulse
- **Fintech Instagram**: Think Robinhood, Coinbase promo videos
- **Gaming Trailers**: Apex Legends, Cyberpunk 2077 (neon aesthetic)

### Key Success Metrics
- **Rewatch Rate**: Trailer must be rewatchable 3+ times (addictive pacing)
- **Shareability**: Must feel "premium enough" to flex with
- **Sound-Off Clarity**: Visuals must tell story even on mute (social media autoplay)
- **Brand Recall**: Viewer should remember "Wolf" + "Cyan/Purple" + "TCG data"

### What This Is NOT
- ❌ Educational explainer video
- ❌ Feature demo walkthrough
- ❌ Slow, cinematic brand film
- ❌ Generic stock footage montage

### What This IS
- ✅ Aggressive, bass-heavy flex
- ✅ FOMO-inducing data showcase
- ✅ Hypnotic visual assault
- ✅ The TCG video equivalent of a Lamborghini reveal

---

## 🎯 FINAL DELIVERABLES SUMMARY

1. **Apex_Trailer_9x16_60fps_v1.mp4** (1080x1920, H.264, 20 Mbps, 18s)
2. **Apex_Trailer_16x9_60fps_v1.mp4** (1920x1080, H.264, 18 Mbps, 18s)
3. **Apex_Trailer_9x16_ProRes.mov** (lossless master archive)
4. **Apex_Trailer_16x9_ProRes.mov** (lossless master archive)
5. **apex_trailer_captions.srt** (subtitles for accessibility)
6. **apex_trailer_thumbnail.png** (1080x1920, end frame)
7. **apex_trailer_preview.gif** (540x960, first 6s loop)

**Total Project Size**: ~2.5 GB (with ProRes masters)
**Working Files**: Apex_Intelligence_Trailer_18s_v1.aep + assets folder

---

## 🔥 LAUNCH STRATEGY (November 20, 2025)

### Simultaneous Multi-Platform Drop
**Exact Time**: 9:00 AM EST (maximum engagement window)

**Platform Order** (post within 5-minute window):
1. **X (Twitter)**: Lead platform — 16:9 version
   - Caption: "The hunt is over. 🐺"
   - Hashtags: #TradingCards #TCG #Pokemon #MTG #Investing
2. **Instagram Reels**: 9:16 version
   - Caption: "11 months. $428,901. You are early. 🔥"
   - Hashtags: #Reels #TradingCards #PokeInvesting
3. **TikTok**: 9:16 version
   - Caption: "POV: You found the TCG cheat code"
   - Sounds: Use original audio (upload as sound)
4. **LinkedIn**: 16:9 version
   - Caption: "Alternative asset intelligence for trading card investors."
   - Professional tone, no emojis
5. **Discord** (multiple channels):
   - #announcements (community server)
   - Post direct file upload or YouTube link

### Engagement Boosting Tactics
- **Pin Tweet** on X for 48 hours
- **Repost to Stories** (Instagram/LinkedIn) with poll: "Are you late or early?"
- **Engage with Comments** within first hour (critical for algorithm)
- **Cross-Promote**: Share X post to LinkedIn, link Instagram Reel in bio

---

**END OF PRODUCTION BIBLE**

---

> "The hunt is over."
> — Apex Intelligence, November 2025

