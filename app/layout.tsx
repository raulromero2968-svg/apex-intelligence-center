import type { Metadata } from 'next'
import { Chakra_Petch, Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navigation'
import { ApexVisualEngine } from '@/components/layout/ApexVisualEngine'

// TITAN TYPOGRAPHY PROTOCOL
const chakra = Chakra_Petch({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-chakra',
})

const space = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Apex Intelligence | TCG Market Intel & Analysis',
  description: 'Premium trading card game market intelligence, data analysis, and collector insights. The underground intel source for serious TCG investors.',
  keywords: 'TCG, trading cards, Pokemon, Magic the Gathering, market analysis, investment, collectors',
  authors: [{ name: 'Apex Collection' }],
  openGraph: {
    title: 'Apex Intelligence | TCG Market Intel',
    description: 'Premium TCG market intelligence for serious investors',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${chakra.variable} ${space.variable} ${inter.variable} ${mono.variable} font-sans antialiased bg-transparent text-slate-100`}>
        {/* GLOBAL CANVAS (Stars/Matrix) - Covers the whole site */}
        <ApexVisualEngine />

        {/* Content sits on top (z-10) */}
        <div className="relative z-10">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
