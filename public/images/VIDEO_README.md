# Titan Video Asset Required

## File Needed
`titan-loop.mp4`

## Specifications
- **Resolution:** 1920x1080 minimum (4K preferred)
- **Duration:** 10-15 second seamless loop
- **Codec:** H.264 or H.265
- **Aesthetic:** Cinematic military/tactical with:
  - Dark matte surfaces
  - Grid overlays
  - Cyan/purple accent lighting
  - Smooth camera motion (no fisheye/warping)
  - Strategic/intelligence theme

## Generation Prompt
Use the following prompt in Grok/Runway Gen-3/Kling:

```
"Cinematic tactical intelligence briefing environment. Dark matte military surfaces with neon cyan and deep purple accent lighting. Overhead shot, smooth crane movement descending toward a large strategic command table with glowing grid overlays and holographic data projections. The camera moves slowly, revealing depth and layers—no fisheye distortion, no rapid cuts. Ambient particles drift through volumetric god rays. The mood is focused, precise, and high-stakes—like a special operations planning room. Seamless loop. 4K quality, filmic grain, shallow depth of field."
```

## Implementation
Once you have the video file:
1. Save it as `titan-loop.mp4` in this directory (`public/images/`)
2. The `TitanVideoEngine` component will automatically load it
3. Video plays as base layer with code-based physics overlaid on top

## Technical Notes
- Video is set to `opacity-60` with `mix-blend-screen` for integration
- Autoplay, loop, muted, and playsInline attributes ensure smooth operation
- Falls back gracefully if video doesn't load (shows canvas layer only)
