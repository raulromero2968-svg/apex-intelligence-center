import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import AnimatedBackground from '@/components/background/AnimatedBackground';
import '@/styles/animations.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Apex Intelligence - TCG Market Intelligence Center',
  description: 'PS5-style TCG market intelligence platform with advanced tools and analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Animated Background */}
        <AnimatedBackground />

        {/* Main Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Toast Notifications */}
        <Toaster
          position="bottom-right"
          duration={5000}
          closeButton
          pauseWhenPageIsHidden
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
