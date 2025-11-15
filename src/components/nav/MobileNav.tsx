'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: NavLink[];
  logo?: React.ReactNode;
}

export default function MobileNav({ links, logo }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-50 bg-ink/80 backdrop-blur-lg border-b border-white/10"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
            {logo || (
              <Link href="/" className="flex items-center gap-3 text-xl font-bold text-white hover:text-cyan-400 transition-colors duration-300">
                <Image
                  src="/wolf-logo.png"
                  alt="Wolf Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                  priority
                />
                <span>
                  <span className="text-cyan-400">APEX</span> INTELLIGENCE
                </span>
              </Link>
            )}
          </div>

          {/* Desktop Nav - Hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-6">
            {links.filter(link => link.label !== 'Subscribe').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/70 hover:text-cyan-400 hover:shadow-lg hover:shadow-cyan-400/20 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            {links.find(link => link.label === 'Subscribe') && (
              <Link
                href="/subscribe"
                className="btn-cyan"
                aria-label="Subscribe"
              >
                Subscribe
              </Link>
            )}
          </nav>

          {/* Hamburger Button - Shown on <1024px */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
              className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-ink rounded-lg hover:bg-white/10 transition-colors duration-300"
            >
            <motion.span
              animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="w-6 h-0.5 bg-white rounded-full"
            />
            <motion.span
              animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-6 h-0.5 bg-white rounded-full"
            />
            <motion.span
              animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="w-6 h-0.5 bg-white rounded-full"
            />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-ink/95 backdrop-blur-xl border-l border-white/10 z-50 lg:hidden overflow-y-auto"
              style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                paddingLeft: 'env(safe-area-inset-left)',
                paddingRight: 'env(safe-area-inset-right)',
              }}
            >
              {/* Close Button */}
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2 p-4">
                {links.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block min-h-[44px] px-6 py-3 rounded-lg text-white text-lg font-medium hover:bg-white/10 hover:text-cyan-400 hover:shadow-lg hover:shadow-cyan-400/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
