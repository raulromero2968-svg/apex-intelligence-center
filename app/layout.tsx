import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })

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
      <body className={`${inter.variable} ${orbitron.variable} font-sans antialiased`}>
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
