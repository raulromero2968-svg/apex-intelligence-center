'use client';

import React, { useState, useEffect } from 'react';
import { StarfieldBackground } from '@/components/layout/StarfieldBackground';
import { PortfolioDashboard } from '@/components/portfolio/PortfolioDashboard';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function PortfolioPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Simulate "First Login" check
  useEffect(() => {
    const hasOnboarded = localStorage.getItem('apex_onboarded');
    if (!hasOnboarded) {
      setShowOnboarding(true);
      localStorage.setItem('apex_onboarded', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative">
      <StarfieldBackground />

      {/* Onboarding Overlay */}
      {showOnboarding && <OnboardingWizard />}

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
           <div>
             <h1 className="text-3xl font-bold text-white">Portfolio Command</h1>
             <p className="text-slate-400 text-sm mt-1">Real-time asset valuation & risk metrics.</p>
           </div>
           <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(8,145,178,0.5)]">
             + Add Asset
           </button>
        </header>

        <PortfolioDashboard />
      </div>
    </div>
  );
}
