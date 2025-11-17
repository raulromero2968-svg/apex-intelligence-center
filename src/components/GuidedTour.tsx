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

export default function GuidedTour() {
  const [run, setRun] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    // Check if user has seen the tour
    const tourCompleted = localStorage.getItem('apex_tour_completed');
    if (!tourCompleted) {
      setHasSeenTour(false);
      // Delay to ensure DOM elements are ready
      setTimeout(() => setRun(true), 1000);
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
          primaryColor: '#00FFFF',
          textColor: '#ffffff',
          backgroundColor: '#1a1a2e',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
          arrowColor: '#1a1a2e',
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#00FFFF',
          color: '#000',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 600,
        },
        buttonBack: {
          color: '#00FFFF',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#ffffff80',
        },
      }}
      locale={{
        last: 'Finish',
        skip: 'Skip Tour',
        next: 'Next',
        back: 'Back',
      }}
    />
  );
}
