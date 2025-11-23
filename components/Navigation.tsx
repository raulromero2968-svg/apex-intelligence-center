'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/intel', label: 'Intel' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/about', label: 'About' },
    { href: '/subscribe', label: 'Subscribe' },
  ]

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/90 border-b border-neon-cyan/20">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <img 
              src="/images/apex-wolf-black-bg-final.png" 
              alt="Apex Intelligence Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold font-[family-name:var(--font-orbitron)] text-glow-cyan">
              APEX<span className="text-neon-pink">_</span>INTELLIGENCE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  text-sm font-medium transition-all duration-300
                  ${pathname === item.href
                    ? 'text-neon-cyan text-glow-cyan'
                    : 'text-gray-300 hover:text-neon-cyan'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/subscribe" className="btn-primary">
              Get Intel
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-neon-cyan"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-neon-cyan/20">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  block text-sm font-medium transition-all duration-300
                  ${pathname === item.href
                    ? 'text-neon-cyan text-glow-cyan'
                    : 'text-gray-300 hover:text-neon-cyan'
                  }
                `}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/subscribe"
              className="block btn-primary text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Intel
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
