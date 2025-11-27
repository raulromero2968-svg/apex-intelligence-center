import { MessageCircle, Twitter, Instagram, Linkedin, Github } from 'lucide-react';
import Link from 'next/link';
import { SOCIAL_PROFILES } from '@/lib/constants';

export const Footer = () => {
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
            <h3 className="text-cyan-400 font-bold text-lg mb-4">Apex Intelligence</h3>
            <p className="text-gray-400 text-sm">
              Underground intelligence for serious TCG collectors and investors.
            </p>
          </div>
          
          {/* Quick Links Column */}
          <div>
            <h3 className="text-cyan-400 font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/intel" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Intel</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Blog</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">About</Link></li>
              <li><Link href="/community" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Community</Link></li>
              <li><Link href="/tutorial" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">New to Apex?</Link></li>
              <li><Link href="/apex-omnis-studios" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Apex Omnis Studios</Link></li>
            </ul>
          </div>
          
          {/* Legal Column */}
          <div>
            <h3 className="text-cyan-400 font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Disclaimer</Link></li>
              <li><Link href="/security" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Security</Link></li>
            </ul>
          </div>
          
          {/* Connect Column */}
          <div>
            <h3 className="text-cyan-400 font-bold text-lg mb-4">Connect</h3>
            <div className="flex gap-4">
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
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-cyan-500/20 text-center text-gray-500 text-sm">
          © 2025 Apex Intelligence. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

