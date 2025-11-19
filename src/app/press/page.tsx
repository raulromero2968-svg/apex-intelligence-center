import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import RouteTransition from '@/layout/RouteTransition';

export const metadata: Metadata = {
  title: 'Press Kit - TCG Intelligence Center',
  description: 'Download logos, trailers, and media assets for TCG Intelligence Center',
};

export default function PressPage() {
  return (
    <RouteTransition>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  Press Kit
                </span>
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Download logos, trailers, and media assets for journalists and content creators
              </p>
            </div>

            {/* Logo Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Logo Assets</h2>
              <p className="text-white/70">
                Use these logo assets in articles, videos, and social media posts. Please maintain
                the logo's aspect ratio and don't alter the design.
              </p>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Main Logo */}
                <div className="space-y-4 p-6 rounded-lg bg-white/5 border border-white/10">
                  <div className="relative w-full aspect-square bg-black/20 rounded-lg flex items-center justify-center p-8">
                    <Image
                      src="/wolf-logo.png"
                      alt="Apex Intelligence Wolf Logo"
                      fill
                      className="object-contain mix-blend-screen"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">Main Logo</h3>
                    <p className="text-sm text-white/60">PNG with transparent background</p>
                    <a
                      href="/wolf-logo.png"
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/50 rounded-lg text-cyan-400 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download PNG
                    </a>
                  </div>
                </div>

                {/* Alternative Logos */}
                <div className="space-y-4 p-6 rounded-lg bg-white/5 border border-white/10">
                  <div className="relative w-full aspect-square bg-black/20 rounded-lg flex items-center justify-center p-8">
                    <Image
                      src="/apex-intelligence-wolf-logo-transparent.png"
                      alt="Apex Intelligence Alternative Logo"
                      fill
                      className="object-contain mix-blend-screen"
                      onError={(e) => {
                        // Fallback if image doesn't exist
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">Alternative Logo</h3>
                    <p className="text-sm text-white/60">High-res transparent PNG</p>
                    <a
                      href="/apex-intelligence-wolf-logo-transparent.png"
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/50 rounded-lg text-cyan-400 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download PNG
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Trailer Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Product Trailer</h2>
              <p className="text-white/70">
                Watch the TCG Intelligence Center trailer. Use the embed code or download the video
                for your coverage.
              </p>

              <div className="space-y-4 p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center border border-white/10">
                  <div className="text-center space-y-4">
                    <svg
                      className="w-16 h-16 mx-auto text-white/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-white/70">
                      Trailer video will be embedded here when available
                    </p>
                    <p className="text-sm text-white/50">
                      For now, contact us for trailer access
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="mailto:press@apexintelligence.com"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-400 transition-colors"
                  >
                    Request Trailer Access
                  </a>
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                  >
                    Download Video (Coming Soon)
                  </button>
                </div>
              </div>
            </section>

            {/* Brand Guidelines */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Brand Guidelines</h2>
              <div className="space-y-4 p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white">Color Palette</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="h-20 bg-[#0A0E1A] rounded-lg border border-white/10"></div>
                      <p className="text-sm text-white/70">Ink (#0A0E1A)</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-20 bg-[#00D9FF] rounded-lg"></div>
                      <p className="text-sm text-white/70">Cyan (#00D9FF)</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-20 bg-[#9333EA] rounded-lg"></div>
                      <p className="text-sm text-white/70">Purple (#9333EA)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h3 className="text-xl font-semibold text-white">Usage Guidelines</h3>
                  <ul className="space-y-2 text-white/70 list-disc list-inside">
                    <li>Maintain logo aspect ratio - do not stretch or distort</li>
                    <li>Provide adequate clear space around the logo (minimum 20% of logo width)</li>
                    <li>Use on dark backgrounds for best visibility</li>
                    <li>Do not place logo on busy backgrounds that reduce readability</li>
                    <li>Do not alter logo colors or add effects</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Press Contact</h2>
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white/70 mb-4">
                  For press inquiries, interview requests, or additional assets, please contact:
                </p>
                <a
                  href="mailto:press@apexintelligence.com"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  press@apexintelligence.com
                </a>
              </div>
            </section>

            {/* Back to Home */}
            <div className="pt-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </RouteTransition>
  );
}

