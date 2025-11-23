import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })

export const metadata: Metadata = {
  metadataBase: new URL('https://apex-intelligence.io'),
  title: {
    default: 'Apex Intelligence | TCG Market Intel & Analysis',
    template: '%s | Apex Intelligence'
  },
  description: 'Premium trading card game market intelligence, data analysis, and collector insights. The underground intel source for serious TCG investors.',
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
    url: 'https://apex-intelligence.io',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${orbitron.variable} font-sans antialiased`}>
        <ServiceWorkerRegistration />
        <div className="relative min-h-screen">
          {/* Background effects */}
          <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none" />

          {/* Gradient orbs */}
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-float" />
          <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

          {/* Content */}
          <div className="relative z-10">
            <Navigation />
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
