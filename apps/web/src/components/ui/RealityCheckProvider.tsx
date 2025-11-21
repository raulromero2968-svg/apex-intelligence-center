'use client';

import { useState, useEffect } from 'react';
import RealityCheckModal from './RealityCheckModal';
import { getSessionTracker } from '@/lib/sessionActivityTracker';
import { getDailySpend } from '@/lib/spendTracker';

/**
 * RealityCheckProvider
 *
 * Integrates session activity tracking with reality check modal.
 * - Automatically tracks session time
 * - Triggers modal every 2 hours of active time
 * - Listens for Redis pub/sub force triggers
 * - Displays session stats and daily spend
 */
export default function RealityCheckProvider() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTime, setActiveTime] = useState('0m');
  const [activeHours, setActiveHours] = useState(0);
  const [dailySpend, setDailySpend] = useState(0);

  useEffect(() => {
    // Initialize session tracker
    const tracker = getSessionTracker();

    // Set up reality check callback
    tracker.onRealityCheck((sessionData) => {
      // Update stats
      setActiveTime(tracker.getFormattedActiveTime());
      setActiveHours(tracker.getActiveHours());
      setDailySpend(getDailySpend());

      // Show modal
      setIsModalOpen(true);
    });

    // Also update stats every 10 seconds for live display
    const statsInterval = setInterval(() => {
      setActiveTime(tracker.getFormattedActiveTime());
      setActiveHours(tracker.getActiveHours());
      setDailySpend(getDailySpend());
    }, 10000);

    // Listen for Redis pub/sub force trigger via SSE or polling
    // For now, we'll use a simple polling mechanism
    // In production, this would use Redis pub/sub via WebSocket
    const checkForForceTrigger = async () => {
      try {
        const response = await fetch('/api/reality-check/status');
        if (response.ok) {
          const data = await response.json();
          if (data.shouldTrigger) {
            // Force trigger the modal
            setActiveTime(tracker.getFormattedActiveTime());
            setActiveHours(tracker.getActiveHours());
            setDailySpend(getDailySpend());
            setIsModalOpen(true);

            // Acknowledge the trigger
            await fetch('/api/reality-check/acknowledge', {
              method: 'POST',
            });
          }
        }
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.error('Failed to check for force trigger:', error);
      }
    };

    // Check for force trigger every 30 seconds
    const forceTriggerInterval = setInterval(checkForForceTrigger, 30000);

    // Cleanup
    return () => {
      clearInterval(statsInterval);
      clearInterval(forceTriggerInterval);
      tracker.stop();
    };
  }, []);

  const handleModalComplete = () => {
    setIsModalOpen(false);
  };

  return (
    <RealityCheckModal
      isOpen={isModalOpen}
      activeTime={activeTime}
      activeHours={activeHours}
      dailySpend={dailySpend}
      onComplete={handleModalComplete}
    />
  );
}
