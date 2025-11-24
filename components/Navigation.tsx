'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Terminal, Activity, Layers, FileText, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WolfConstellation } from '@/components/hero/WolfConstellation';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

<<<<<<< HEAD
  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Intel', href: '/intel', icon: <Terminal size={18} /> },
    { name: 'Portfolio', href: '/portfolio', icon: <Activity size={18} /> },
    { name: 'Commons', href: '/commons', icon: <Users size={18} /> },
    { name: 'About', href: '/about', icon: <Layers size={18} /> },
    { name: 'Subscribe', href: '/subscribe', icon: <FileText size={18} /> },
  ];
=======
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/intel', label: 'Intel Center' },
    { href: '/research', label: 'Research' },
    { href: '/about', label: 'About' },
    { href: '/subscribe', label: 'Subscribe' },
  ]
>>>>>>> origin/claude/realtime-intelligence-chat-014ot9GLRmGVQfCHcm5tagnN

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#030712]/80 backdrop-blur-md border-b border-cyan-500/20'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* LOGO SECTION - 2D CONSTELLATION WOLF */}
          <Link href="/" className="flex-shrink-0 flex items-center group">
            <div className="w-12 h-12 mr-3 transition-transform duration-300 group-hover:scale-105">
              <WolfConstellation />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-orbitron tracking-wider text-white">
                APEX
              </span>
              <span className="text-[0.65rem] text-cyan-400 font-mono tracking-[0.2em] uppercase">
                Intelligence
              </span>
            </div>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="group flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors duration-200 relative overflow-hidden"
                >
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-4 group-hover:ml-0 text-cyan-500">
                    {link.icon}
                  </span>
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}

              {/* CTA Button */}
              <Link
                href="/login"
                className="ml-4 px-6 py-2 border border-cyan-500/50 rounded-none text-cyan-400 font-mono text-sm hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300"
              >
                [ ACCESS_TERMINAL ]
              </Link>
            </div>
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-cyan-500 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#030712] border-b border-cyan-500/20 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-300 hover:text-cyan-400 block px-3 py-4 rounded-md text-base font-medium border-l-2 border-transparent hover:border-cyan-500 hover:bg-white/5"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-cyan-500">{link.icon}</span>
                    {link.name}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;
