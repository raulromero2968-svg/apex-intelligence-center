// System font stack matching Apex Commons
// Uses native fonts for optimal performance and consistent cross-platform appearance
export const fontSans = {
  style: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
  },
  variable: '--font-sans',
};

// Keep monospace font for technical/terminal aesthetic
// Used in headers, labels, classification badges, and technical content
import { JetBrains_Mono } from 'next/font/google';

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
