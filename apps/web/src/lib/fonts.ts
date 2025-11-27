import { Inter, JetBrains_Mono } from 'next/font/google';

// Primary sans-serif font for body text
export const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Monospace font for Intel/Terminal aesthetic
// Used in headers, labels, classification badges, and technical content
export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
