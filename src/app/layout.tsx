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
import GuidedTour from '@/components/GuidedTour';
import HelpFAB from '@/components/HelpFAB';
import ToastHost from '@/components/ToastHost';
import { generateAllSchemas, toScriptTag, getFacts } from '@/lib/jsonld';
import '@/styles/animations.css';
import './globals.css';

// Load facts from central registry
const facts = getFacts();

export const metadata: Metadata = {
  title: facts.product.fullName,
  description: facts.product.description,
  openGraph: {
    title: facts.product.fullName,
    description: facts.product.description,
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: facts.organization.tagline,
      },
    ],
    type: 'website',
    siteName: facts.product.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: facts.product.fullName,
    description: facts.product.description,
    images: ['/api/og'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate JSON-LD schemas from facts registry
  const schemas = generateAllSchemas();

  return (
    <html lang="en" className="h-full">
      <head>
        {/* JSON-LD Structured Data - Generated from /data/facts.json */}
        {schemas.map((schema, index) => (
          <script
            key={`jsonld-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: toScriptTag(schema) }}
          />
        ))}
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
