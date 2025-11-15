import { MessageCircle, Twitter, Instagram, Linkedin } from 'lucide-react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-black/40 border-t border-cyan-500/20 mt-24" role="contentinfo">
      {/* Connect to Collectr */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/30 rounded-2xl p-12">
          <div className="w-16 h-16 mx-auto mb-6 border-2 border-cyan-400 rounded-full flex items-center justify-center" aria-hidden="true">
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold mb-4">Connect to Collectr</h2>
          <p className="text-gray-400 mb-6">
            Already using Collectr for portfolio tracking? Import your portfolio to unlock personalized market insights and AI-powered recommendations based on your actual collection.
          </p>

          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">🔗 Integration Coming Soon</p>
            <p className="text-sm text-gray-400">
              We&apos;re partnering with Collectr to bring you seamless portfolio sync. Join our waitlist to be notified when this feature launches.
            </p>
          </div>

          <button className="bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold px-8 py-3 rounded-lg transition-all min-h-[44px]" aria-label="Join waitlist">
            Join Waitlist
          </button>
        </div>
      </div>

      {/* Weekly Intel */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Get Weekly Intel</h2>
        <p className="text-gray-400 mb-8">Free market analysis and insights delivered to your inbox every week</p>
        <Link href="/subscribe" className="btn-cyan" aria-label="Subscribe for free">Subscribe for Free →</Link>
      </div>

      {/* Footer Links */}
      <div className="container mx-auto px-4 py-12 border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-cyan-400 font-bold text-lg mb-4">Apex Intelligence</h3>
            <p className="text-gray-400 text-sm">Underground intelligence for serious TCG collectors and investors.</p>
          </div>

          <div>
            <h3 className="text-cyan-400 font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/intel" className="hover:text-cyan-400 transition-colors">Intel</Link></li>
              <li><Link href="/about" className="hover:text-cyan-400 transition-colors">About</Link></li>
              <li><Link href="/apex-omnis-studios" className="hover:text-cyan-400 transition-colors">Apex Omnis Studios</Link></li>
              <li><Link href="/apex-commons" className="hover:text-cyan-400 transition-colors">Apex Commons</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-cyan-400 font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="hover:text-cyan-400 transition-colors">Disclaimer</Link></li>
              <li><Link href="/company-info" className="hover:text-cyan-400 transition-colors">Company Info</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-cyan-400 font-bold text-lg mb-4">Connect</h3>
            <div className="flex gap-4">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join our Discord"
                className="group inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-cyan-400/30 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              >
                <MessageCircle className="h-5 w-5 text-cyan-400 transition-opacity group-hover:opacity-90" aria-hidden="true" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Twitter"
                className="group inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-cyan-400/30 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              >
                <Twitter className="h-5 w-5 text-cyan-400 transition-opacity group-hover:opacity-90" aria-hidden="true" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="group inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-cyan-400/30 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              >
                <Instagram className="h-5 w-5 text-cyan-400 transition-opacity group-hover:opacity-90" aria-hidden="true" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect on LinkedIn"
                className="group inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-cyan-400/30 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              >
                <Linkedin className="h-5 w-5 text-cyan-400 transition-opacity group-hover:opacity-90" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
