import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import AuroraFX from '@/components/fx/AuroraFX';
import BackgroundFX from '@/components/fx/BackgroundFX';
import BackgroundStack from '@/components/fx/BackgroundStack';
import { CustomCursor } from '@/components/cursor/CustomCursor';
import { TopBanner } from '@/components/nav/TopBanner';
import { AnimatedBackground } from '@/components/background/AnimatedBackground';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Footer } from '@/components/footer/Footer';
import { StructuredData } from '@/components/StructuredData';
import GuidedTour from '@/components/GuidedTour';
import HelpFAB from '@/components/HelpFAB';
import ToastHost from '@/components/ToastHost';
import '@/styles/animations.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'TCG Intelligence Center - Market Intelligence Platform',
  description: 'PS5-style TCG market intelligence platform with advanced tools and analytics',
  openGraph: {
    title: 'TCG Intelligence Center - Market Intelligence Platform',
    description: 'Data-driven market analysis, real-time insights, and exclusive research for the modern TCG investor.',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'TCG Intelligence Center - Underground Intel For Serious Collectors',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TCG Intelligence Center - Market Intelligence Platform',
    description: 'Data-driven market analysis, real-time insights, and exclusive research for the modern TCG investor.',
    images: ['/api/og'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <StructuredData />
      </head>
      <body className="min-h-dvh font-sans antialiased cursor-none">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-cyan-400 focus:text-black focus:px-3 focus:py-2 focus:rounded focus:z-[9999]">
          Skip to main content
        </a>

        {/* Custom Cursor */}
        <CustomCursor />

        {/* Top Banner */}
        <TopBanner />

        {/* Animated Background */}
        <AnimatedBackground />

        {/* Aurora Background */}
        <AuroraFX />

        {/* Animated Background FX */}
        <BackgroundFX />

        {/* Additional Background Layers (Starfield, Kanji River, Shooting Squares) */}
        <BackgroundStack />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Main Content */}
        <main className="relative z-10 pt-16" id="main">
          {children}
        </main>

        {/* Footer */}
        <Footer />

        {/* Guided Tour */}
        <GuidedTour />

        {/* Help FAB */}
        <HelpFAB />

        {/* Toast Notifications */}
        <Toaster
          position="bottom-right"
          duration={5000}
          closeButton
          toastOptions={{
            classNames: {
              toast: 'glass-dark border-cyan-400 shadow-lg shadow-cyan-400/20',
              title: 'text-white font-medium',
              description: 'text-white/70',
              actionButton: 'bg-cyan-400 text-ink',
              cancelButton: 'bg-white/10 text-white',
              closeButton: 'bg-white/10 text-white hover:bg-white/20',
            },
          }}
        />

        {/* Custom Toast Bus */}
        <ToastHost />
      </body>
    </html>
  );
}
