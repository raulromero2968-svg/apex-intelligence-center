/**
 * Generate Static OG Thumbnail
 *
 * This script generates the static og-thumbnail.png for social media sharing.
 * Uses the same design as the dynamic /api/og endpoint for consistency.
 *
 * Run: npx tsx scripts/generate-og-thumbnail.ts
 *
 * Requirements for PNG generation:
 * - npm install -D sharp (for PNG conversion)
 * - OR use ImageMagick: convert og-thumbnail.svg og-thumbnail.png
 */

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Brand colors from Tailwind config
const colors = {
  cyan: '#00D9FF',
  purple: '#9333EA',
  magenta: '#FF00FF',
  ink: '#0A0E1A',
  inkLight: '#1a1f3a',
};

// Use seeded random for consistent star positions across builds
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate SVG content matching the OG design with starfield effect
const width = 1200;
const height = 630;

// Generate stars with seeded random for consistency
const generateStars = (count: number): string => {
  let stars = '';
  for (let i = 0; i < count; i++) {
    const x = seededRandom(i * 3.14159) * width;
    const y = seededRandom(i * 2.71828) * height;
    const r = 0.5 + seededRandom(i * 1.41421) * 1.5;
    const opacity = 0.3 + seededRandom(i * 1.61803) * 0.7;
    const color = seededRandom(i) < 0.6 ? '#dff9ff' : '#e6d6ff';
    stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`;
  }
  return stars;
};

const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.ink}"/>
      <stop offset="100%" style="stop-color:${colors.inkLight}"/>
    </linearGradient>

    <!-- Cyan glow filter -->
    <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feFlood flood-color="${colors.cyan}" flood-opacity="0.5"/>
      <feComposite in2="blur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Title gradient -->
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.cyan}"/>
      <stop offset="100%" style="stop-color:${colors.purple}"/>
    </linearGradient>

    <!-- Grid pattern -->
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="${colors.cyan}" stroke-width="0.5" opacity="0.15"/>
    </pattern>

    <!-- Nebula gradient overlay -->
    <radialGradient id="nebula1" cx="20%" cy="30%" r="40%">
      <stop offset="0%" style="stop-color:${colors.cyan};stop-opacity:0.08"/>
      <stop offset="100%" style="stop-color:${colors.cyan};stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="nebula2" cx="80%" cy="70%" r="35%">
      <stop offset="0%" style="stop-color:${colors.purple};stop-opacity:0.1"/>
      <stop offset="100%" style="stop-color:${colors.purple};stop-opacity:0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>

  <!-- Starfield layer -->
  <g id="starfield">
    ${generateStars(150)}
  </g>

  <!-- Nebula effects -->
  <rect width="100%" height="100%" fill="url(#nebula1)"/>
  <rect width="100%" height="100%" fill="url(#nebula2)"/>

  <!-- Grid overlay -->
  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.4"/>

  <!-- Content area -->
  <g transform="translate(80, 80)">
    <!-- Category badge -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="180" height="48" rx="8"
            fill="${colors.ink}" stroke="${colors.cyan}" stroke-width="2"/>
      <text x="90" y="32" font-family="system-ui, -apple-system, sans-serif"
            font-size="18" font-weight="600" fill="${colors.cyan}"
            text-anchor="middle" letter-spacing="2">INTELLIGENCE</text>
    </g>

    <!-- Main Title -->
    <text y="220" font-family="system-ui, -apple-system, sans-serif"
          font-size="68" font-weight="800" fill="url(#titleGrad)">
      <tspan x="0">Apex Intelligence</tspan>
    </text>

    <!-- Subtitle -->
    <text y="290" font-family="system-ui, -apple-system, sans-serif"
          font-size="36" font-weight="600" fill="white" opacity="0.9">
      <tspan x="0">TCG Market Intelligence Platform</tspan>
    </text>

    <!-- Tagline -->
    <text y="350" font-family="system-ui, -apple-system, sans-serif"
          font-size="22" fill="${colors.purple}" font-weight="500">
      <tspan x="0">Yu-Gi-Oh! • Lorcana • Pokémon • VARC™ Technology</tspan>
    </text>
  </g>

  <!-- Footer divider line -->
  <line x1="80" y1="480" x2="1120" y2="480" stroke="${colors.cyan}" stroke-width="2" opacity="0.4"/>

  <!-- Footer brand -->
  <g transform="translate(80, 520)">
    <text font-family="system-ui, -apple-system, sans-serif"
          font-size="28" font-weight="700" fill="${colors.cyan}" letter-spacing="1">
      APEX INTELLIGENCE
    </text>
    <text y="40" font-family="system-ui, -apple-system, sans-serif"
          font-size="18" fill="${colors.purple}" font-weight="500">
      One platform. Total clarity.
    </text>
  </g>

  <!-- Logo circle -->
  <g transform="translate(1000, 510)">
    <circle cx="60" cy="40" r="50" fill="${colors.ink}"
            stroke="${colors.cyan}" stroke-width="3"/>
    <g transform="translate(20, 0)">
      <path d="M 40 10 L 15 25 L 40 40 L 65 25 Z"
            stroke="${colors.cyan}" stroke-width="2" fill="none"/>
      <path d="M 15 45 L 40 60 L 65 45"
            stroke="${colors.purple}" stroke-width="2" fill="none"/>
      <path d="M 15 35 L 40 50 L 65 35"
            stroke="${colors.magenta}" stroke-width="2" fill="none"/>
    </g>
  </g>
</svg>`;

// Main execution
async function main() {
  const publicDir = join(process.cwd(), 'public');
  const svgPath = join(publicDir, 'og-thumbnail.svg');
  const pngPath = join(publicDir, 'og-thumbnail.png');

  // Save SVG file
  writeFileSync(svgPath, svgContent);
  console.log(`✓ Generated SVG: ${svgPath}`);

  // Try to convert to PNG using sharp if available
  try {
    const sharp = await import('sharp').then(m => m.default);
    await sharp(Buffer.from(svgContent))
      .resize(1200, 630)
      .png()
      .toFile(pngPath);
    console.log(`✓ Generated PNG: ${pngPath}`);
  } catch {
    // Sharp not available, provide instructions
    console.log(`
ℹ PNG conversion requires 'sharp'. Install with: npm install -D sharp

Alternative conversion methods:
1. ImageMagick: convert ${svgPath} ${pngPath}
2. Inkscape: inkscape ${svgPath} --export-filename=${pngPath} --export-width=1200
3. rsvg-convert: rsvg-convert -w 1200 ${svgPath} > ${pngPath}
4. Browser: Open SVG and save as PNG

For production, add this postbuild script to package.json:
"postbuild": "npx tsx scripts/generate-og-thumbnail.ts"
`);
  }
}

main().catch(console.error);
