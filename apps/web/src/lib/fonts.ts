import { Inter, JetBrains_Mono } from 'next/font/google';

/**
 * Apex Design System - Typography
 *
 * Inter: Primary UI font - clean, professional, highly legible
 * JetBrains Mono: Monospace for data, terminals, and technical content
 */

// Inter - Primary sans-serif font for UI
export const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

// JetBrains Mono - Monospace for technical/terminal aesthetic
// Used in data displays, code blocks, and classification badges
export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
