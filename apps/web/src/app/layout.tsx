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

      <body className="min-h-dvh font-sans antialiased cursor-none">

        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-cyan-400 focus:text-black focus:px-3 focus:py-2 focus:rounded focus:z-[9999]">

          Skip to main content

        </a>



        {/* Permanent Equilibrium Banner - Non-dismissible */}

        <div className="fixed inset-x-0 top-0 z-[60] bg-cyan-500/10 backdrop-blur border-b border-cyan-500/40 text-center text-[10px] sm:text-xs md:text-sm text-cyan-300 font-semibold tracking-wide py-2 shadow-lg">

          PRODUCTION EQUILIBRIUM ACHIEVED – NOVEMBER 19 2025

        </div>



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

        <main className="relative z-10 pt-24" id="main">

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
