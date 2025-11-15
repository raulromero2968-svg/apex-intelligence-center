import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import AuroraFX from '@/components/fx/AuroraFX';
import BackgroundFX from '@/components/fx/BackgroundFX';
import BackgroundStack from '@/components/fx/BackgroundStack';
import CursorFX from '@/components/fx/CursorFX';
import { Footer } from '@/components/footer/Footer';
import '@/styles/animations.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'TCG Intelligence Center - Market Intelligence Platform',
  description: 'PS5-style TCG market intelligence platform with advanced tools and analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-dvh font-sans antialiased [cursor:none] md:[cursor:none] [&_a]:cursor-none [&_button]:cursor-none [&_input]:cursor-text">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-cyan-400 focus:text-black focus:px-3 focus:py-2 focus:rounded focus:z-[9999]">
          Skip to main content
        </a>

        {/* Aurora Background */}
        <AuroraFX />

        {/* Animated Background FX */}
        <BackgroundFX />

        {/* Additional Background Layers (Starfield, Kanji River, Shooting Squares) */}
        <BackgroundStack />

        {/* Custom Cursor */}
        <CursorFX />

        {/* Main Content */}
        <div className="relative z-10" id="main">
          {children}
        </div>

        {/* Footer */}
        <Footer />

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
      </body>
    </html>
  );
}
