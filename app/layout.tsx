// app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.apexintelligence.io'),
  title: {
    default: 'Apex Intelligence | TCG Market Intel & Analysis',
    template: '%s | Apex Intelligence'
  },
  description: 'Trade AI models, build reputation, and explore the Apex Intelligence ecosystem. Premium trading card game market intelligence for serious collectors.',
  keywords: ['TCG', 'trading cards', 'Pokemon', 'Magic the Gathering', 'MTG', 'Lorcana', 'Yu-Gi-Oh', 'market analysis', 'investment', 'collectors', 'grading', 'PSA', 'BGS'],
  authors: [{ name: 'Apex Intelligence' }],
  creator: 'Apex Intelligence',
  publisher: 'Apex Intelligence',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Apex Intel',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.apexintelligence.io',
    title: 'Apex Intelligence | TCG Market Intel & Analysis',
    description: 'Underground intel meets surface-level access. Premium TCG market intelligence for serious collectors and investors.',
    siteName: 'Apex Intelligence',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Apex Intelligence - TCG Market Intel',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apex Intelligence | TCG Market Intel',
    description: 'Premium TCG market intelligence for serious collectors and investors',
    images: ['/og-image.png'],
  },
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
}

type NavItem = {
  label: string
  href: string
  external?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'INTEL', href: '/research' },
  { label: 'LAB', href: '/deck-builder' },
  { label: 'PHILOSOPHY', href: '/philosophy' },
  { label: 'PORTFOLIO', href: '/portfolio' },
  { label: 'COMMONS', href: 'https://www.apexcommons.org', external: true },
  { label: 'PHD', href: '/living-phd' },
  { label: 'ABOUT', href: '/about' },
  { label: 'PRICING', href: '/pricing' },
  { label: 'SUBSCRIBE', href: '/subscribe' },
]

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-[11px] font-bold">
            AI
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold tracking-[0.25em] text-cyan-300">
              APEX
            </span>
            <span className="text-xs font-semibold text-white">
              INTELLIGENCE
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 text-[11px] font-medium text-zinc-300 md:flex">
          {NAV_ITEMS.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="uppercase tracking-[0.2em] transition hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="uppercase tracking-[0.2em] transition hover:text-white"
              >
                {item.label}
              </Link>
            ),
          )}

          <Link
            href="/terminal"
            className="ml-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black shadow-sm transition hover:bg-zinc-100"
          >
            ACCESS TERMINAL
          </Link>
        </nav>

        {/* Mobile: minimal – logo + terminal button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/terminal"
            className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black shadow-sm"
          >
            TERMINAL
          </Link>
        </div>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-black px-4 py-6 text-[11px] text-zinc-500 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 md:flex-row">
        <p>&copy; {new Date().getFullYear()} Apex Intelligence. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/docs" className="hover:text-zinc-300">
            Docs
          </Link>
          <Link href="/governance" className="hover:text-zinc-300">
            Governance
          </Link>
          <Link href="/privacy" className="hover:text-zinc-300">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-300">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${orbitron.variable} font-sans min-h-screen bg-black text-white antialiased`}>
        <ServiceWorkerRegistration />
        <AnalyticsProvider>
          <div className="relative min-h-screen flex flex-col">
            {/* Background effects */}
            <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none" />

            {/* Gradient orbs */}
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-float" />
            <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

            {/* Content */}
            <div className="relative z-10 flex flex-col min-h-screen">
              <SiteHeader />
              <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
                {children}
              </main>
              <SiteFooter />
            </div>
          </div>
        </AnalyticsProvider>
      </body>
    </html>
  )
}
