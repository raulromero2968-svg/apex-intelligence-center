'use client';

import { useEffect, useState } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

const steps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Apex Intelligence – your institutional-grade TCG market intelligence platform.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-intelligence"]',
    content: 'Browse the latest market analysis, research reports, and intelligence notes here.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tools-carousel"]',
    content: 'Explore our suite of professional tools – drag to scroll through all available options.',
    placement: 'top',
  },
  {
    target: '[data-tour="intelligence-tabs"]',
    content: 'Filter content by TCG category to focus on Pokémon, MTG, or Yu-Gi-Oh! markets.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tutorial"]',
    content: 'Need a refresher? Visit the tutorial anytime for detailed guidance on using our platform.',
    placement: 'bottom',
  },
];

// Optimal engagement timing: 210 seconds (3.5 minutes)
// Based on UX research showing users are most receptive to guidance after initial exploration
const TOUR_DELAY_MS = 210000; // 3.5 minutes

export default function GuidedTour() {
  const [run, setRun] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if user has seen the tour (only on client)
    const tourCompleted = localStorage.getItem('apex_tour_completed');
    if (!tourCompleted) {
      setHasSeenTour(false);
      // Delay to allow user to explore before showing tour
      // 3.5 minutes is optimal for engagement without being intrusive
      setTimeout(() => setRun(true), TOUR_DELAY_MS);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('apex_tour_completed', 'true');
      setHasSeenTour(true);
    }
  };

  // Function to restart tour (can be called from help button)
  const restartTour = () => {
    setRun(true);
  };

  // Expose restart function globally for help button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).restartApexTour = restartTour;
    }
  }, []);

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#06b6d4', // Cyan
          textColor: '#e2e8f0', // Slate-200
          backgroundColor: '#0f172a', // Slate-900
          overlayColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 10000,
          arrowColor: '#0f172a',
        },
        tooltip: {
          borderRadius: 12,
          padding: 24,
          border: '2px solid rgba(6, 182, 212, 0.3)', // Cyan border
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.3), 0 0 80px rgba(168, 85, 247, 0.2)', // Cyan/purple glow
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Gradient background
          fontFamily: 'var(--font-sans)',
        },
        tooltipContent: {
          padding: '8px 0',
          fontSize: '15px',
          lineHeight: '1.6',
          color: '#cbd5e1', // Slate-300
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 700,
          color: '#06b6d4', // Cyan
          marginBottom: '8px',
          textShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
        },
        buttonNext: {
          backgroundColor: '#06b6d4', // Cyan
          color: '#0f172a', // Dark text
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 700,
          border: 'none',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
          transition: 'all 0.3s ease',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        buttonBack: {
          color: '#a855f7', // Purple
          marginRight: 12,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        buttonSkip: {
          color: '#64748b', // Slate-500
          fontSize: 13,
          fontWeight: 500,
        },
        beacon: {
          inner: '#06b6d4',
          outer: 'rgba(6, 182, 212, 0.3)',
        },
        beaconInner: {
          backgroundColor: '#06b6d4',
        },
        beaconOuter: {
          backgroundColor: 'rgba(6, 182, 212, 0.3)',
          border: '2px solid #06b6d4',
        },
        spotlight: {
          borderRadius: 8,
        },
      }}
      locale={{
        last: '[ FINISH ]',
        skip: 'Skip Tour',
        next: '[ NEXT ]',
        back: '[ BACK ]',
      }}
    />
  );
}
