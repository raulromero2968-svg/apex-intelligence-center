# APEX INTELLIGENCE CINEMATIC TRAILER — QUICK START GUIDE

**Total Production Time**: 48 hours
**Your Mission**: Create the single greatest 18-second TCG trailer in history

---

## 🚀 STEP 1: GATHER ALL ASSETS (Hour 0-2)

### Download/Install Required Software
- [ ] **Adobe After Effects CC 2024** (or later)
- [ ] **Adobe Media Encoder CC 2024**
- [ ] **Audio editing software** (Audacity/Ableton/Logic Pro)

### Collect Brand Assets (Already Prepared)
- [x] Wolf logo PNG (`/public/wolf-logo.png`) — ✅ Ready
- [x] Color scheme documented — ✅ Cyan (#00FFFF) + Purple (#9333ea)
- [x] Fonts: Geist Mono + Geist Sans — Check if installed on system
- [x] Data files — ✅ All JSON files created in `/public/data/trailer/`

### Source Additional Assets
- [ ] **Audio track** (18 seconds, cinematic bass drop at 0:08)
  - Option 1: Artlist.io (search "cinematic bass drop trailer")
  - Option 2: Epidemic Sound (search "aggressive synth trailer")
  - Option 3: YouTube Audio Library (free, "epic cinematic bass")
  - **Download**: WAV format, 48kHz, stereo

- [ ] **Card images** (optional, for realism):
  - Umbreon VMAX Alt Art (eBay/TCGPlayer screenshot)
  - Charizard Base Set 1st Ed (PSA website)
  - Pokémon 151 cards (for scatter plot)

### Font Installation
```bash
# Check if Geist fonts are installed
# If not, download from:
# https://vercel.com/font (Geist family is open-source)

# Install on Mac:
# Double-click .otf files → Install Font

# Install on Windows:
# Right-click .otf files → Install
```

---

## 🎨 STEP 2: SET UP AFTER EFFECTS PROJECT (Hour 2-4)

### Create New Project
```
File → New → New Project
Save As: Apex_Intelligence_Trailer_18s_v1.aep
Location: /home/user/apex-intelligence-center/production/
```

### Import Assets
```
File → Import → File...

Import all:
- wolf-logo.png
- apex_trailer_master_v1.wav (your audio track)
- umbreon-vmax-price-data.json (reference only)
- Any card images (optional)

Organize into folders:
📁 Assets
  ├── 📁 Logos
  ├── 📁 Audio
  ├── 📁 Data (for reference)
  └── 📁 Cards (if applicable)
```

### Create Master Compositions

#### 9:16 Vertical (Primary)
```
Composition → New Composition

Name: [MASTER] 9x16_Vertical_Main
Width: 1080 px
Height: 1920 px
Pixel Aspect Ratio: Square Pixels
Frame Rate: 60 fps
Duration: 0:00:19:00 (19 seconds)
Background Color: #0a0e1a (Ink)

✅ Click OK
```

#### 16:9 Horizontal (Secondary)
```
Composition → New Composition

Name: [MASTER] 16x9_Horizontal_Main
Width: 1920 px
Height: 1080 px
Frame Rate: 60 fps
Duration: 0:00:19:00

✅ Click OK
```

---

## 🎬 STEP 3: BUILD SHOT COMPOSITIONS (Hour 4-18)

Work through each shot sequentially. Reference the full Production Bible (`CINEMATIC_TRAILER_PRODUCTION_BIBLE.md`) for detailed specs.

### Shot 1: Portfolio Explosion (0:00 - 0:03)

#### Create Composition
```
Composition → New Composition
Name: 01_Portfolio_Explosion
Dimensions: 1080 x 1920, 60fps
Duration: 0:00:03:00
```

#### Build Layers (Bottom to Top)
1. **Background Solid**
   - Layer → New → Solid
   - Color: #0a0e1a (Ink)
   - Name: "BG_Solid"

2. **Aurora FX** (Optional: Create precomp or skip if time-constrained)
   - Create purple/cyan gradient shape layers
   - Apply slow drift animation
   - Set blend mode: Screen

3. **Portfolio Counter Text**
   - Layer → New → Text
   - Type: "$428,901"
   - Font: Geist Mono Bold, 120pt
   - Color: #00FFFF (Cyan)
   - Align: Center, Center
   - Effect → Stylize → Glow
     - Glow Threshold: 50%
     - Glow Radius: 40px
     - Glow Intensity: 1.5

4. **Add Counter Expression**
   - Click text layer → Press `E` to reveal effects
   - Alt-Click (Mac: Option-Click) on "Source Text" stopwatch
   - Paste expression from `AE_EXPRESSIONS_LIBRARY.jsx` (Expression #1)

5. **Camera Push Animation**
   - Layer → New → Adjustment Layer (name: "Camera Push")
   - Press `S` (scale property)
   - Keyframe 1 at 0:00 → Scale: 110%
   - Keyframe 2 at 3:00 → Scale: 120%
   - Right-click keyframes → Keyframe Assistant → Easy Ease

#### Nest in Master
```
Open: [MASTER] 9x16_Vertical_Main
Drag: 01_Portfolio_Explosion into timeline at 0:00
```

---

### Shot 2: Timeline Reveal (0:03 - 0:06)

#### Create Composition
```
Name: 02_Timeline_Reveal
Duration: 0:00:03:00
```

#### Build Layers
1. **Previous Portfolio Number** (scaled down from Shot 1)
   - Duplicate final frame of Shot 1 counter
   - Scale: 40%, move to top-right corner
   - Add fade-in (0.4s)

2. **Starfield Background**
   - Create 150 small circle shapes (2-4px)
   - Colors: 60% cyan, 40% purple
   - Randomize positions across canvas
   - Animate opacity pulsing (0.3-0.8)

3. **Timeline Text**
   - Text: "in 11 months"
   - Font: Geist Sans Regular, 64pt
   - Color: White → Cyan gradient
   - Position: Lower third, centered
   - Animate: Letter-by-letter reveal (use Expression #7)

#### Nest in Master at 0:03

---

### Shot 3: The Ultimatum (0:06 - 0:08)

#### Create Composition
```
Name: 03_Ultimatum
Duration: 0:00:02:00
```

#### Build Layers
1. **Pure Black Background**
   - Solid: #000000

2. **Grid Pattern** (Optional)
   - Effect → Generate → Grid
   - Color: #00FFFF, 20% opacity
   - Size: 50px

3. **"You are late" Text**
   - Font: Geist Mono Medium, 72pt
   - Color: #FF3B3B (Red)
   - Effect: Glow (crimson)
   - Visible: 0:00 - 0:07 (fades out)

4. **"You are early" Text**
   - Font: Geist Mono Medium, 72pt
   - Color: #00FFFF (Cyan)
   - Effect: Glow (cyan electric)
   - Visible: 0:07 - 0:08
   - Add glitch effect at 0:07 (Expression #9: RGB Split)

5. **Glitch Adjustment Layer**
   - Effect → Channel → Channel Blur
   - Apply RGB split expressions
   - Active only for 4 frames at 0:07

#### Audio Sync Critical Point
```
⚠️ BASS DROP MUST HIT AT EXACTLY 0:08.000
Place marker on timeline at 0:08 for reference
```

#### Nest in Master at 0:06

---

### Shot 4: Data Onslaught (0:08 - 0:12)

This is **3 rapid panels** — build each as separate comps.

#### Panel A: Arbitrage Scanner (0:08 - 0:09.333)
```
Name: 04a_Arbitrage_Panel
Duration: 0:00:01:10 (1.33 seconds at 60fps = 80 frames)
```

**Layers**:
1. Dark background with grid pattern
2. Text: "ARBITRAGE DETECTED" (red alert box, flashing)
3. Text: "$47,230 spread" (large, green)
4. Simple line graph showing price delta
   - Red line (eBay): $89,000
   - Green line (Mercari): $41,770
5. Flash transition: Red → Green (0.15s)

**Data Source**: Reference `/public/data/trailer/arbitrage-opportunity-mock.json`

#### Panel B: Umbreon Moonshot (0:09.333 - 0:10.667)
```
Name: 04b_Umbreon_Moonshot
Duration: 0:00:01:10
```

**Layers**:
1. **Y-Axis Grid** (shape layer, purple, 15% opacity)
2. **X-Axis Grid** (shape layer, purple, 15% opacity)
3. **Price Line** (shape layer)
   - Tool: Pen tool
   - Draw path with 5 points:
     - Point 1: (x=200, y=1400) → $340
     - Point 2: (x=400, y=1300) → $385
     - Point 3: (x=600, y=1000) → $520
     - Point 4: (x=800, y=500) → $890
     - Point 5: (x=1000, y=200) → $1,180
   - Stroke: 3px, #00FFFF, no fill
   - Add: Trim Paths (Expression #2: 0% to 100% draw-in)
   - Add: Glow effect (10px)

4. **Fill Area** (duplicate price line, add gradient fill)
   - Fill: Cyan gradient (35% top → 0% bottom)

5. **Peak Particle Burst**
   - Effect → Simulation → CC Particle World
   - Producer: Point 5 position
   - Birth Rate: 100 (only at 10.5s for 0.5s)
   - Color: Cyan
   - Velocity: Radial explosion

6. **Annotation Text**
   - Text: "+247% in 28 days"
   - Position: Near peak, offset right
   - Fade in at 10.2s

**Data Source**: Reference `/public/data/trailer/umbreon-vmax-price-data.json`

#### Panel C: 3D Scatter Plot (0:10.667 - 0:12)
```
Name: 04c_3D_Scatter
Duration: 0:00:01:10
```

**Layers**:
1. **3D Grid Cube** (wireframe, cyan/purple)
   - Create using shape layers in 3D space
   - Enable 3D layer toggle

2. **Scatter Points** (20 cards)
   - Create 20 small circle shapes (10-30px diameter)
   - Position based on data:
     - X: Popularity Score (0-100)
     - Y: Price ($0-$900)
     - Size: PSA Population (bubble size)
   - Colors: Alternate cyan/purple
   - Enable 3D layer toggle for all

3. **Hero Point: Charizard SAR**
   - Largest bubble (50px)
   - Color: Orange-cyan gradient
   - Text label: "Charizard SAR — $875"

4. **Camera**
   - Layer → New → Camera
   - Preset: 50mm
   - Animate Y Rotation: 0° → 360° over 1.3s (Expression #12)

5. **Charizard Lock-In**
   - After rotation, camera zooms to Charizard point
   - Other points blur (Camera > Depth of Field enabled)

**Data Source**: Reference `/public/data/trailer/pokemon-151-scatter-data.json`

#### Combine Panels in Master
```
Open: [MASTER] 9x16_Vertical_Main
Add layers:
- 04a_Arbitrage_Panel at 0:08.000
- 04b_Umbreon_Moonshot at 0:09.333
- 04c_3D_Scatter at 0:10.667

Between each panel: Add 2-frame white flash (adjustment layer, white solid, 2 frames)
```

---

### Shot 5: Brand Lockup (0:12 - 0:14)

#### Create Composition
```
Name: 05_Brand_Lockup
Duration: 0:00:02:00
```

#### Build Layers
1. **Aurora FX Background** (max intensity)
2. **Neon Squares** (floating geometric shapes)
   - 6 squares, various sizes (100-200px)
   - Cyan/purple borders, 30% opacity
   - Slow rotation animations

3. **Text: "APEX INTELLIGENCE"**
   - Two separate text layers:
     - Layer 1: "APEX" (Geist Sans Bold, 84pt)
     - Layer 2: "INTELLIGENCE" (Geist Sans Bold, 84pt)
   - Color: White → Cyan/Purple animated gradient
   - Animation:
     - "INTELLIGENCE" appears first (bottom)
     - "APEX" drops in from above (0.2s later)
   - Spacing: 20px vertical gap

4. **Underline**
   - Shape layer: Horizontal line under "INTELLIGENCE"
   - Stroke: 2px, cyan
   - Animate: Trim Paths 0% → 100% (0.4s)

5. **Subtitle**
   - Text: "Trading Card Intelligence Platform"
   - Font: Geist Sans Light, 24pt
   - Color: White 60% opacity
   - Fade in at 0:13.5

#### Nest in Master at 0:12

---

### Shot 6: Wolf Reveal + Tagline (0:14 - 0:18)

#### Create Composition
```
Name: 06_Wolf_Reveal
Duration: 0:00:04:00
```

#### Build Layers
1. **Deep Space Background**
   - Solid: #000000
   - Add subtle starfield (100 stars, defocused, distant)

2. **Wolf Logo**
   - Import: wolf-logo.png
   - Size: 600px height, center frame
   - **Fragment Effect**:
     - Effect → Simulation → Shatter
     - Shape: Custom (120 pieces)
     - Physics:
       - At 14.0s: Fragments scattered (explosion)
       - At 15.5s: Reverse animation (magnetic snap together)
     - OR use CC Particle World for advanced control

   - **Glow Effect**:
     - Effect → Stylize → Glow
     - Radius: 60px
     - Intensity: 40% opacity
     - Color: Cyan-purple gradient (mask/gradient overlay)

3. **Scan Line**
   - Shape layer: Horizontal line (2px, cyan, 80% opacity)
   - Animate Y position: -100px → 700px (15.5s - 16.0s)
   - Blend mode: Add

4. **Tagline Text**
   - Text: "The hunt is over."
   - Font: Geist Mono Medium, 56pt
   - Color: White with cyan underline
   - Position: 140px below logo center
   - Fade in: 16.0s - 16.4s

5. **Cyan Underline** (under tagline)
   - Shape layer: 2px stroke
   - Animate: Trim Paths 0% → 100% (16.2s - 16.5s)

6. **Camera Zoom Out**
   - Adjustment layer: Scale 100% → 95% (14.0s - 17.5s)

7. **Final Breathing Animation**
   - Wolf logo: Apply Expression #18 (subtle scale loop 100% → 102% → 100%)

#### Nest in Master at 0:14

---

### Shot 7: Fade Out (0:18 - 0:19)

#### In Master Comp
```
Add adjustment layer: "Fade Out"
Layer → New → Adjustment Layer

Effect → Generate → Fill
Color: #000000 (Black)
Animate Opacity:
- Keyframe at 18.0s: Opacity = 0%
- Keyframe at 18.8s: Opacity = 100%

Result: Entire composition fades to black
```

---

## 🔊 STEP 4: SOUND DESIGN & SYNC (Hour 18-24)

### Import Audio
```
Drag: apex_trailer_master_v1.wav into [MASTER] 9x16_Vertical_Main timeline
Position: 0:00.000
```

### Critical Sync Points (Add Markers)
```
Right-click timeline → Add Marker at:
- 0:00.000 → "Bass riser starts"
- 0:08.000 → "BASS DROP" (⚠️ CRITICAL)
- 0:09.333 → "Panel A → B transition"
- 0:10.667 → "Panel B → C transition"
- 0:12.000 → "Brand reveal"
- 0:16.000 → "Tagline appears"
- 0:18.000 → "Fade out begins"
```

### Frame-by-Frame Sync Check
```
1. Scrub timeline to 0:08.000 (bass drop)
2. Verify visual elements hit EXACTLY on this frame:
   - Arbitrage panel appears
   - White flash occurs
   - Scale/shake effect triggers

Adjust timing by moving layers 1-2 frames if needed
```

### Audio Mixing Tips
- Ensure audio peaks at -0.3dB (no clipping)
- Add subtle "swoosh" sounds at panel transitions (0:09.33, 0:10.67)
- Final bass note sustains until 0:18, then hard cut to silence

---

## 🎨 STEP 5: POLISH & REFINEMENT (Hour 24-36)

### Color Grading
```
Add adjustment layer: "Color Grade" (top of layer stack)

Effect → Color Correction → Lumetri Color
Adjustments:
- Contrast: +10
- Saturation: +5 (boost cyan/purple)
- Shadows: Lift blacks slightly (+5)
- Highlights: Preserve whites (-5)
```

### Motion Blur
```
Enable motion blur for:
- Camera push/pull layers
- Text animations (fast reveals)
- Wolf fragment assembly
- 3D scatter rotation

How to enable:
1. Toggle motion blur switch on layer (icon looks like circles)
2. Enable motion blur for composition (switch at top of timeline)
```

### Glow Enhancements
```
For all text layers with cyan/purple:
Effect → Stylize → Glow
- Threshold: 50%
- Radius: 30-60px
- Intensity: 1.5-2.0
- Composite: Behind/On Top (experiment)
```

### Final Quality Check
```
Render preview frames at:
- 0:00 (portfolio counter)
- 0:08 (bass drop / data onslaught)
- 0:16 (wolf + tagline final hold)

Check for:
✅ Text readable (no blur/pixelation)
✅ Colors vibrant (cyan/purple pop)
✅ Motion smooth (60fps maintained)
✅ Audio sync perfect (bass drop at 0:08)
✅ No clipping/artifacts
```

---

## 🎥 STEP 6: RENDER & EXPORT (Hour 36-42)

### Step 6a: Render ProRes Master (Lossless Archive)

```
Composition → Add to Render Queue (or click [MASTER] 9x16_Vertical_Main)

Render Settings:
- Quality: Best
- Resolution: Full
- Time Span: Length of Comp (0:00 - 0:19)

Output Module Settings:
- Format: QuickTime
- Format Options:
  - Codec: Apple ProRes 4444
  - Quality: 100%
- Audio Output: ON
  - Sample Rate: 48000 Hz
  - Bit Depth: 24-bit
  - Channels: Stereo

Output To: Apex_Trailer_9x16_ProRes_Master.mov
Location: /production/renders/

✅ Click Render
```

**Estimated Render Time**: 10-20 minutes (depending on system)
**File Size**: ~800 MB - 1.2 GB

---

### Step 6b: Encode for Social Media (H.264)

```
Open: Adobe Media Encoder

Drag: Apex_Trailer_9x16_ProRes_Master.mov into queue

Preset: H.264 (Custom)

Video Settings:
- Basic:
  - Width: 1080
  - Height: 1920
  - Frame Rate: 60
  - Field Order: Progressive
  - Aspect: Square Pixels (1.0)

- Bitrate:
  - Encoding: VBR, 2 pass
  - Target Bitrate: 20 Mbps
  - Maximum Bitrate: 25 Mbps

- Advanced:
  - Profile: High
  - Level: 4.2
  - Render at Maximum Depth: ✅
  - Use Maximum Render Quality: ✅

Audio Settings:
- Codec: AAC
- Bitrate: 320 kbps
- Sample Rate: 48000 Hz
- Channels: Stereo

Output Name: Apex_Trailer_9x16_60fps_FINAL.mp4
Location: /production/final_deliverables/

✅ Click Queue → Start Queue
```

**Estimated Encode Time**: 5-10 minutes
**File Size**: ~45-55 MB

---

### Step 6c: Repeat for 16:9 Version

```
In After Effects:
1. Open: [MASTER] 16x9_Horizontal_Main
2. Adjust layout:
   - Scale text elements to 85% size
   - Reposition for wider frame
   - Extend background elements to 1920px width
3. Add to Render Queue
4. Render ProRes Master: Apex_Trailer_16x9_ProRes_Master.mov
5. Encode H.264: Apex_Trailer_16x9_60fps_FINAL.mp4
```

---

### Step 6d: Create Optional Deliverables

#### GIF Preview (First 6 Seconds)
```
In Media Encoder:
Source: Apex_Trailer_9x16_60fps_FINAL.mp4
Set In/Out Points: 0:00 - 0:06

Format: Animated GIF
Settings:
- Dimensions: 540 x 960 (half-res)
- Frame Rate: 24 fps
- Looping: Forever
- Dithering: Diffusion
- Colors: 256
- Quality: 100

Output: Apex_Trailer_Preview.gif
Target File Size: < 5 MB
```

#### Static Thumbnail
```
In After Effects:
1. Open [MASTER] 9x16_Vertical_Main
2. Scrub to 0:17.500 (final wolf hold frame)
3. Composition → Save Frame As → File...
4. Format: PNG
5. Output: Apex_Trailer_Thumbnail.png (1080x1920)
```

---

## 📤 STEP 7: FINAL DELIVERY & REVIEW (Hour 42-48)

### Quality Assurance Checklist

Upload to private test account and verify:

- [ ] **Duration**: Exactly 18-19 seconds
- [ ] **Aspect Ratio**: 9:16 fills vertical screen perfectly (Instagram/TikTok)
- [ ] **Frame Rate**: Smooth 60fps playback (no stuttering)
- [ ] **Audio Sync**: Bass drop hits EXACTLY at 0:08
- [ ] **Text Readable**: All text clear and legible on mobile
- [ ] **Colors Vibrant**: Cyan/purple pop, not washed out
- [ ] **No Artifacts**: No pixelation, banding, or compression glitches
- [ ] **File Size**: Under platform limits (< 100 MB for all platforms)
- [ ] **Sound Quality**: Clean audio, no distortion or clipping
- [ ] **Brand Consistency**: Wolf logo clear, colors match website

### Platform-Specific Tests

#### Instagram Reels Test
```
1. Upload Apex_Trailer_9x16_60fps_FINAL.mp4 to private account
2. Check:
   - Vertical fill (no black bars)
   - Auto-play works (sound on/off)
   - Quality maintained (no heavy compression)
3. If issues: Re-export at 30fps or lower bitrate (15 Mbps)
```

#### TikTok Test
```
1. Upload to TikTok (use original audio)
2. Check:
   - Full-screen vertical
   - Audio synced correctly
   - No lag on transitions
3. If issues: Reduce resolution to 720x1280 (still HD)
```

#### Twitter/X Test
```
1. Upload Apex_Trailer_16x9_60fps_FINAL.mp4
2. Check:
   - Embeds correctly in timeline
   - Plays smoothly on desktop/mobile
   - Thumbnail represents video well
3. If issues: Re-export at 1280x720 (720p HD)
```

---

### Final File Organization

```
/production/
├── Apex_Intelligence_Trailer_18s_v1.aep (AE project file)
│
├── /assets/
│   ├── wolf-logo.png
│   ├── apex_trailer_master_v1.wav
│   └── (any card images)
│
├── /renders/
│   ├── Apex_Trailer_9x16_ProRes_Master.mov (lossless archive)
│   └── Apex_Trailer_16x9_ProRes_Master.mov
│
└── /final_deliverables/ ⭐ UPLOAD THESE
    ├── Apex_Trailer_9x16_60fps_FINAL.mp4 (Instagram/TikTok)
    ├── Apex_Trailer_16x9_60fps_FINAL.mp4 (Twitter/LinkedIn)
    ├── Apex_Trailer_Preview.gif (email/Discord preview)
    ├── Apex_Trailer_Thumbnail.png (social media thumbnail)
    └── apex_trailer_captions.srt (accessibility subtitles)
```

---

## 🚀 LAUNCH DAY: NOVEMBER 20, 2025

### Pre-Launch Checklist (Night Before)
- [ ] All files uploaded to cloud backup (Google Drive/Dropbox)
- [ ] Captions written for each platform
- [ ] Hashtags researched and ready
- [ ] Post scheduled for 9:00 AM EST (peak engagement)
- [ ] Team notified of launch time
- [ ] Discord announcement draft ready
- [ ] Email signature updated with GIF preview

### Launch Sequence (9:00 AM EST)
```
T-0:00 → Post to X/Twitter (16:9 version)
T+0:02 → Post to Instagram Reels (9:16 version)
T+0:04 → Post to TikTok (9:16 version, add trending hashtags)
T+0:06 → Post to LinkedIn (16:9 version, professional caption)
T+0:08 → Share to Discord #announcements
T+0:10 → Pin tweet on X
T+0:15 → Repost to Instagram Stories with poll
```

### Caption Templates

**X/Twitter**:
```
The hunt is over. 🐺

11 months. $428,901.

Apex Intelligence: Real-time TCG arbitrage, portfolio tracking, and market intelligence.

You are early.

#TradingCards #Pokemon #MTG #Investing
```

**Instagram Reels**:
```
11 months. $428,901. 🔥

You are early.

Apex Intelligence — the smartest way to invest in trading cards.

#Reels #TradingCards #PokeInvesting #TCG #Pokemon #MagicTheGathering
```

**TikTok**:
```
POV: You found the TCG cheat code 👀

#TradingCards #Pokemon #Investing #TCG #FinTok #MoneyTok
```

**LinkedIn**:
```
Alternative asset intelligence for trading card investors.

We built Apex Intelligence to bring institutional-grade analytics to the $10B+ trading card market.

Real-time arbitrage detection. Portfolio optimization. Predictive grading analysis.

11 months. $428,901 portfolio growth. This is just the beginning.

Learn more: apexintelligence.center

#AlternativeAssets #TradingCards #FinTech
```

---

## 🎯 SUCCESS METRICS (Track After 48 Hours)

- **Views**: Target 50,000+ across all platforms
- **Engagement Rate**: Target 8%+ (likes, comments, shares)
- **Saves**: Target 500+ (Instagram) — High save rate = viral potential
- **Shares**: Target 200+ retweets/shares
- **Website Traffic**: Track spike in apexintelligence.center visits
- **Discord Sign-Ups**: Monitor new member influx
- **Most Viral Platform**: Identify which platform performs best for future content

---

## 💡 TROUBLESHOOTING

### Issue: Video looks pixelated/compressed
**Solution**: Re-export at higher bitrate (25 Mbps) or use ProRes for upload if platform supports

### Issue: Bass drop not syncing at 0:08
**Solution**: Open AE project, move Shot 4 comp by 1-2 frames until perfect sync

### Issue: File size too large for platform
**Solution**: Re-encode at lower bitrate (15 Mbps) or reduce resolution to 720p

### Issue: Colors look washed out on mobile
**Solution**: Boost saturation in Lumetri Color (+10 instead of +5)

### Issue: Text not readable on small screens
**Solution**: Increase font size by 10% and add stronger glow/outline

### Issue: Audio distorted/clipping
**Solution**: Re-export audio with -1.0dB headroom, apply limiter in audio editor

---

## 📞 NEED HELP?

If you encounter issues during production:

1. **After Effects Help**: Adobe Forums (community.adobe.com)
2. **Expression Errors**: Check `AE_EXPRESSIONS_LIBRARY.jsx` for syntax
3. **Audio Sync Issues**: Use markers and scrub frame-by-frame
4. **Creative Decisions**: Reference Production Bible for director's intent
5. **Platform Specs**: Check official social media video specs pages

---

**You have 48 hours. Make it legendary.**

🐺 The hunt is over.
