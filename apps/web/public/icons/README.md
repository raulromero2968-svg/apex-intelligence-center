# Holographic Icon Assets

This directory should contain the following holographic icon PNG files:

## Required Icons

1. **holographic-icon-portfolio-tracker.png** - Portfolio tracking tool icon
2. **holographic-icon-trade-calculator.png** - Trade calculator tool icon
3. **holographic-icon-grading-optimizer.png** - Grading optimizer tool icon
4. **holographic-icon-bulk-analyzer.png** - Bulk analyzer tool icon
5. **holographic-icon-reprint-predictor.png** - Reprint predictor tool icon
6. **holographic-icon-sealed-analyzer.png** - Sealed analyzer tool icon
7. **holographic-icon-tax-dashboard.png** - Tax dashboard tool icon

## Specifications

- **Format**: PNG with transparency
- **Recommended Size**: 256x256px or higher (will be scaled down)
- **Style**: Holographic/iridescent effect, PS5-inspired aesthetic
- **Color Palette**: Cyan (#00D9FF) and Purple (#9333EA) accents

## Usage

These icons are referenced in `src/lib/iconMap.ts` and used by the `HolographicIcon` component throughout the application.

## Placeholder

Until actual holographic icons are available, you can use temporary placeholder images with the same filenames.

## PWA Icons (Required)

For Progressive Web App functionality, the following icons are required:

1. **icon-192.png** - 192x192px PNG icon for PWA manifest
2. **icon-512.png** - 512x512px PNG icon for PWA manifest

These icons should:
- Represent the Apex Intelligence brand
- Be square (1:1 aspect ratio)
- Use the brand colors (cyan #0891b2, black background)
- Be optimized PNG files
- Support maskable icons (safe zone: 80% of icon area)

**Note**: These icons are referenced in `/manifest.webmanifest` and are required for the PWA to pass Lighthouse checks and be installable.