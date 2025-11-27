'use client';

import RouteTransition from '@/layout/RouteTransition';

export default function GuidesPage() {
  return (
    <RouteTransition>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Expert Guides
          </h1>
          <p className="text-white/70 mb-12">
            Expert guide to maximizing ROI through strategic grading
          </p>
          {/* Add guide grid here */}
          <div className="text-white/50 text-center py-12">
            <p>Guides coming soon...</p>
          </div>
        </main>
      </div>
    </RouteTransition>
  );
}
