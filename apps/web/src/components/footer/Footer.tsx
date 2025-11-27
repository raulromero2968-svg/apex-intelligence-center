'use client';

import { MessageCircle, Twitter, Instagram, Linkedin, Github, Sun, Moon, Monitor } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SOCIAL_PROFILES } from '@/lib/constants';

export const Footer = () => {
  const pathname = usePathname() ?? '';

  // Hide Footer on homepage - it has its own standalone layout
  if (pathname === '/') {
    return null;
  }

  return (
    <footer 
      className="relative mt-20 border-t border-cyan-500/20"
      style={{
        background: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.6) 20%, rgba(0, 0, 0, 0.9) 100%)',
      }}
      role="contentinfo"
    >
      {/* Connect to Collectr */}
      <div className="container mx-auto px-6 py-16">
        <div className="relative max-w-2xl mx-auto">
          {/* Card with stronger background */}
          <div 
            className="relative z-10 rounded-2xl p-10 border border-cyan-500/30"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 78, 99, 0.85) 0%, rgba(88, 28, 135, 0.85) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 255, 255, 0.15)',
            }}
          >
            {/* Collectr content */}
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">Connect to Collectr</h2>
              
              <p className="text-gray-300 mb-6 max-w-lg">
                Already using Collectr for portfolio tracking? Import your portfolio to unlock personalized market insights and AI-powered recommendations based on your actual collection.
              </p>
              
              {/* Integration Coming Soon */}
              <div className="flex items-center gap-2 text-cyan-400 mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-sm">Integration Coming Soon</span>
              </div>
              
              <p className="text-gray-400 text-sm mb-8 max-w-md">
                We&apos;re partnering with Collectr to bring you seamless portfolio sync. Join our waitlist to be notified when this feature launches.
              </p>
              
              <button className="bg-transparent hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500 font-semibold px-8 py-3 rounded-lg transition-all">
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Apex Intelligence Column */}
          <div>
            <h3 className="text-white font-bold tracking-wider uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] text-sm mb-4">Apex Intelligence</h3>
            <p className="text-gray-400 text-sm">
              Underground intelligence for serious TCG collectors and investors.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-white font-bold tracking-wider uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/intel" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm drop-shadow-none filter-none">Intel</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm drop-shadow-none filter-none">Blog</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm drop-shadow-none filter-none">About</Link></li>
              <li><Link href="/community" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm drop-shadow-none filter-none">Community</Link></li>
              <li><Link href="/tutorial" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm drop-shadow-none filter-none">New to Apex?</Link></li>
              <li><Link href="/apex-omnis-studios" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm drop-shadow-none filter-none">Apex Omnis Studios</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-white font-bold tracking-wider uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] text-sm mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm drop-shadow-none filter-none">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm drop-shadow-none filter-none">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm drop-shadow-none filter-none">Disclaimer</Link></li>
              <li><Link href="/security" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm drop-shadow-none filter-none">Security</Link></li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h3 className="text-white font-bold tracking-wider uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] text-sm mb-4">Connect</h3>
            <div className="flex gap-4 mb-6">
              <a
                href={SOCIAL_PROFILES.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on X (Twitter)"
                className="w-10 h-10 border border-cyan-500/50 rounded-lg flex items-center justify-center hover:bg-cyan-500/20 transition-colors"
              >
                <Twitter className="w-5 h-5 text-cyan-400" />
              </a>
              <a
                href={SOCIAL_PROFILES.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect on LinkedIn"
                className="w-10 h-10 border border-cyan-500/50 rounded-lg flex items-center justify-center hover:bg-cyan-500/20 transition-colors"
              >
                <Linkedin className="w-5 h-5 text-cyan-400" />
              </a>
              <a
                href={SOCIAL_PROFILES.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="w-10 h-10 border border-cyan-500/50 rounded-lg flex items-center justify-center hover:bg-cyan-500/20 transition-colors"
              >
                <Instagram className="w-5 h-5 text-cyan-400" />
              </a>
              <a
                href={SOCIAL_PROFILES.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View our GitHub repository"
                className="w-10 h-10 border border-cyan-500/50 rounded-lg flex items-center justify-center hover:bg-cyan-500/20 transition-colors"
              >
                <Github className="w-5 h-5 text-cyan-400" />
              </a>
            </div>

            {/* HARD-CODED THEME TOGGLE - Enhanced Visibility */}
            <div className="mt-6 border-t border-slate-800 pt-6 flex items-center gap-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">System Theme</span>
              <div className="flex items-center gap-1 bg-slate-900 rounded-full p-1 border border-slate-800">
                <button
                  className="p-1 rounded-full bg-slate-800 text-cyan-400 hover:bg-slate-700 transition-colors"
                  aria-label="Light mode"
                >
                  <Sun className="w-3 h-3" />
                </button>
                <button
                  className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Dark mode"
                >
                  <Moon className="w-3 h-3" />
                </button>
                <button
                  className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="System theme"
                >
                  <Monitor className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          {/* Vercel-Style Theme Badge */}
          <div className="flex items-center gap-2 text-xs border border-slate-800 rounded-full px-3 py-1 cursor-not-allowed opacity-70">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Titan OS (Stable)</span>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            © 2025 Apex Intelligence. All rights reserved.
          </div>
        </div>

        {/* FORCED FOOTER TOGGLE - Bottom Center */}
        <div className="w-full flex justify-center py-8 border-t border-slate-900/50 mt-12">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-950 border border-slate-800 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">System Theme</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_5px_#22d3ee]" /> {/* Active */}
              <div className="w-3 h-3 rounded-full bg-slate-800" />
              <div className="w-3 h-3 rounded-full bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
