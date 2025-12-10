'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { IntelSearch } from './search/IntelSearch'

// Navigation item types
interface NavItem {
  href: string
  label: string
  external?: boolean
  children?: NavItem[]
}

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Primary nav items - maps to your core app sections
  const navItems: NavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/terminal', label: 'Terminal' },
    {
      href: '/intel',
      label: 'Intel',
      children: [
        { href: '/intel', label: 'All Intel' },
        { href: '/research', label: 'Research Hub' },
        { href: '/magazine', label: 'Magazine' },
        { href: '/living-phd', label: 'Living PhD' },
      ]
    },
    { href: '/market', label: 'Market' },
    { href: '/portfolio', label: 'Portfolio' },
    {
      href: '/deck-builder',
      label: 'Lab',
      children: [
        { href: '/deck-builder', label: 'Deck Builder' },
        { href: '/deck-gallery', label: 'Deck Gallery' },
        { href: '/tournaments', label: 'Tournaments' },
      ]
    },
  ]

  // Secondary nav items (shown in dropdown or footer)
  const secondaryItems: NavItem[] = [
    { href: '/about', label: 'About' },
    { href: '/pricing', label: 'Pricing' },
    { href: 'https://www.apexcommons.org', label: 'Commons', external: true },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/90 border-b border-neon-cyan/20">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <img
              src="/images/apex-wolf-transparent.png"
              alt="Apex Intelligence Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold font-[family-name:var(--font-orbitron)] text-glow-cyan">
              APEX<span className="text-neon-pink">_</span>INTELLIGENCE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative">
                {item.children ? (
                  // Dropdown item
                  <div
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`
                        flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg
                        ${isActive(item.href)
                          ? 'text-neon-cyan'
                          : 'text-gray-300 hover:text-neon-cyan hover:bg-white/5'
                        }
                      `}
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown menu */}
                    {openDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-neon-cyan/20 bg-black/95 backdrop-blur-xl shadow-xl py-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`
                              block px-4 py-2 text-sm transition-colors
                              ${pathname === child.href
                                ? 'text-neon-cyan bg-neon-cyan/10'
                                : 'text-gray-300 hover:text-neon-cyan hover:bg-white/5'
                              }
                            `}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular link
                  <Link
                    href={item.href}
                    className={`
                      px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg
                      ${isActive(item.href)
                        ? 'text-neon-cyan'
                        : 'text-gray-300 hover:text-neon-cyan hover:bg-white/5'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {/* Separator */}
            <div className="h-4 w-px bg-gray-700 mx-2" />

            {/* Secondary items */}
            {secondaryItems.map((item) => (
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-neon-cyan transition-colors"
                >
                  {item.label}
                  <ExternalLink size={12} />
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-3 py-2 text-sm transition-colors
                    ${isActive(item.href)
                      ? 'text-neon-cyan'
                      : 'text-gray-400 hover:text-neon-cyan'
                    }
                  `}
                >
                  {item.label}
                </Link>
              )
            ))}

            <IntelSearch />
            <Link
              href="/subscribe"
              className="ml-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-[12px] font-semibold text-black hover:opacity-90 transition-opacity"
            >
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
          <div className="md:hidden py-4 space-y-1 border-t border-neon-cyan/20">
            {navItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    block px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg
                    ${isActive(item.href)
                      ? 'text-neon-cyan bg-neon-cyan/10'
                      : 'text-gray-300 hover:text-neon-cyan hover:bg-white/5'
                    }
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
                {/* Mobile sub-items */}
                {item.children && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-gray-800 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`
                          block py-1.5 text-sm transition-colors
                          ${pathname === child.href
                            ? 'text-neon-cyan'
                            : 'text-gray-400 hover:text-neon-cyan'
                          }
                        `}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-3 mt-3 border-t border-gray-800 space-y-1">
              {secondaryItems.map((item) => (
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-neon-cyan"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>

            <div className="pt-3">
              <Link
                href="/subscribe"
                className="block text-center rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2.5 text-[13px] font-semibold text-black"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Intel
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
