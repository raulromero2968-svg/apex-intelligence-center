import type { Metadata } from 'next';

import { Toaster } from 'sonner';


import { CustomCursor } from '@/components/cursor/CustomCursor';

import { TopBanner } from '@/components/nav/TopBanner';


import { LayoutFooter } from '@/components/footer/LayoutFooter';


import { ThemeToggle } from '@/components/theme/ThemeToggle';

import { Footer } from '@/components/footer/Footer';

import GuidedTour from '@/components/GuidedTour';

import HelpFAB from '@/components/HelpFAB';

import { BreakModeButton } from '@/components/BreakModeButton';

import ToastHost from '@/components/ToastHost';

import RealityCheckProvider from '@/components/ui/RealityCheckProvider';

import { fontSans } from '@/lib/fonts';

import { cn } from '@/lib/utils';

import { generateAllSchemas, toScriptTag, getFacts } from '@/lib/jsonld';

import '@/styles/animations.css';

import './globals.css';


// Load facts from central registry

const facts = getFacts();



// Default metadata - uses facts registry where available, with fallbacks

export const metadata: Metadata = {

  // Base metadata - using facts registry

  title: {

    default: facts.product.fullName || 'TCG Intelligence Center - Market Intelligence Platform',

    template: '%s | TCG Intelligence Center',

  },

  description: facts.product.description || 'Data-driven market analysis, real-time insights, and exclusive research for the modern TCG investor. PS5-style intelligence platform with advanced tools and analytics.',



  // Keywords for SEO

  keywords: ['TCG', 'trading cards', 'market intelligence', 'analytics', 'Pokemon', 'Magic', 'Yu-Gi-Oh'],



  // Author and creator info

  authors: [{ name: facts.organization.name || 'TCG Intelligence Center' }],

  creator: facts.organization.name || 'TCG Intelligence Center',

  publisher: facts.organization.name || 'TCG Intelligence Center',



  // Robots directives

  robots: {

    index: true,

    follow: true,

    googleBot: {

      index: true,

      follow: true,

      'max-video-preview': -1,

      'max-image-preview': 'large',

      'max-snippet': -1,

    },

  },



  // OpenGraph metadata for rich social cards

  openGraph: {

    type: 'website',

    locale: 'en_US',

    siteName: facts.product.name || 'TCG Intelligence Center',

    title: facts.product.fullName || 'TCG Intelligence Center - Market Intelligence Platform',

    description: facts.product.description || 'Data-driven market analysis, real-time insights, and exclusive research for the modern TCG investor.',

    images: [

      {

        url: '/api/og', // Dynamic OG image endpoint

        width: 1200,

        height: 630,

        alt: facts.organization.tagline || 'TCG Intelligence Center - Underground Intel For Serious Collectors',

        type: 'image/png',

      },

    ],

  },



  // Twitter Card metadata

  twitter: {

    card: 'summary_large_image',

    title: facts.product.fullName || 'TCG Intelligence Center',

    description: facts.product.description || 'Data-driven market analysis for TCG investors',

    images: ['/api/og'],

    creator: '@tcgintel',

  },



  // Verification tags (add actual values when available)

  // verification: {

  //   google: 'google-site-verification-code',

  //   yandex: 'yandex-verification-code',

  // },



  // App-specific metadata

  applicationName: facts.product.name || 'TCG Intelligence Center',



  // Alternate languages (if internationalization is added)

  // alternates: {

  //   canonical: '/',

  //   languages: {

  //     'en-US': '/en-US',

  //   },

  // },

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

        {/* JSON-LD Structured Data - Generated from facts registry */}

        {schemas.map((schema, index) => (

          <script

            key={`jsonld-${index}`}

            type="application/ld+json"

            dangerouslySetInnerHTML={{ __html: toScriptTag(schema) }}

          />

        ))}

      </head>

      <body

        className={cn(

          'min-h-screen bg-slate-950 text-foreground antialiased cursor-none flex flex-col relative overflow-x-hidden',

          fontSans.className,

        )}

      >

        {/* GLOBAL STARFIELD BACKGROUND - Deep space layer with dynamic viewport height for mobile */}
        <div className="fixed inset-0 h-[100dvh] w-screen z-[-2] overflow-hidden">
          {/* CSS-generated starfield pattern */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: `
                radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.8) 1px, transparent 1px),
                radial-gradient(1px 1px at 30% 40%, rgba(34,211,238,0.6) 1px, transparent 1px),
                radial-gradient(2px 2px at 50% 10%, rgba(168,85,247,0.5) 1px, transparent 1px),
                radial-gradient(1px 1px at 70% 80%, rgba(255,255,255,0.7) 1px, transparent 1px),
                radial-gradient(1px 1px at 90% 30%, rgba(34,211,238,0.4) 1px, transparent 1px),
                radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.6) 1px, transparent 1px),
                radial-gradient(2px 2px at 85% 60%, rgba(168,85,247,0.4) 1px, transparent 1px),
                radial-gradient(1px 1px at 40% 90%, rgba(255,255,255,0.5) 1px, transparent 1px),
                radial-gradient(1px 1px at 60% 50%, rgba(34,211,238,0.5) 1px, transparent 1px),
                radial-gradient(1px 1px at 25% 15%, rgba(255,255,255,0.7) 1px, transparent 1px),
                radial-gradient(1px 1px at 75% 25%, rgba(168,85,247,0.3) 1px, transparent 1px),
                radial-gradient(1px 1px at 5% 55%, rgba(255,255,255,0.4) 1px, transparent 1px),
                radial-gradient(1px 1px at 95% 85%, rgba(34,211,238,0.6) 1px, transparent 1px),
                radial-gradient(1px 1px at 35% 65%, rgba(255,255,255,0.5) 1px, transparent 1px),
                radial-gradient(2px 2px at 65% 35%, rgba(168,85,247,0.5) 1px, transparent 1px)
              `,
              backgroundSize: '200px 200px'
            }}
          />
        </div>

        {/* GLOBAL MATRIX BACKGROUND - Enhanced for mobile visibility with dynamic viewport height */}
        <div className="fixed inset-0 h-[100dvh] w-screen z-[-1]">
          {/* Grid Pattern - Brighter cyan (#0891b2), higher opacity for mobile */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0891b2_1px,transparent_1px),linear-gradient(to_bottom,#0891b2_1px,transparent_1px)] bg-[size:50px_50px] opacity-40 md:opacity-30" />
          {/* Scanning Light Effect - Enhanced glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/15 to-transparent animate-scan" />
          {/* Vignette - Softer for better grid visibility */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#020617_100%)]" />
        </div>



        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-cyan-400 focus:text-black focus:px-3 focus:py-2 focus:rounded focus:z-[9999]">

          Skip to main content

        </a>






        {/* Custom Cursor */}

        <CustomCursor />



        {/* Pinned Navigation - Fixed to top with high z-index and glassmorphism */}
        <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <TopBanner />
        </header>



        {/* Theme Toggle */}

        <ThemeToggle />



        <div className="flex-1 flex flex-col">

          {/* Main Content */}

          <main className="relative z-10 flex-1 pt-24" id="main">

            {children}

          </main>



          {/* Footer */}

          <Footer />

        </div>



        {/* Layout Footer - hidden on homepage */}

        <LayoutFooter />



        {/* Guided Tour */}

        <GuidedTour />



        {/* Help FAB */}

        <HelpFAB />



        {/* Break Mode Button */}

        <BreakModeButton />



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

        {/* Reality Check Modal - Triggers every 2h active session */}

        <RealityCheckProvider />

      </body>

    </html>

  );

}
