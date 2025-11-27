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

          'min-h-screen bg-black text-foreground antialiased cursor-none flex flex-col relative overflow-x-hidden',

          fontSans.className,

        )}

      >

        {/* LAYER 1: DEEP SPACE BASE (Fixed) */}
        <div className="fixed inset-0 z-[-10] bg-[#020617]" />

        {/* LAYER 2: STARFIELD (Max Visibility) */}
        <div
          className="fixed inset-0 z-[-9] opacity-100 mix-blend-screen pointer-events-none"
          style={{
            backgroundImage: "url('/images/starfield.png')",
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* LAYER 3: MATRIX GRID (Bright Cyan) */}
        <div
          className="fixed inset-0 z-[-8] opacity-40 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 211, 238, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />



        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-cyan-400 focus:text-black focus:px-3 focus:py-2 focus:rounded focus:z-[9999]">

          Skip to main content

        </a>






        {/* Custom Cursor */}

        <CustomCursor />



        {/* Pinned Navigation - Fixed to top with high z-index and glassmorphism */}
        <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <TopBanner />
        </header>



        {/* Theme Toggle - Disabled temporarily (moved to footer) */}

        {/* <ThemeToggle /> */}



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
