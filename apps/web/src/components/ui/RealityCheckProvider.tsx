'use client';

import { useState, useEffect, useRef } from 'react';
import RealityCheckModal from './RealityCheckModal';
import { getSessionTracker } from '@/lib/sessionTracker';
import { getDailySpend } from '@/lib/spendTracker';

/**
 * RealityCheckProvider
 *
 * Integrates session activity tracking with reality check modal.
 * - Automatically tracks session time with Redis heartbeat
 * - Triggers modal every 2 hours of active time
 * - Listens for Redis pub/sub force triggers via SSE
 * - Displays session stats and daily spend
 * - Unskippable: modal cannot be closed until 10s countdown completes
 * - Cannot be disabled in settings
 */
export default function RealityCheckProvider() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTime, setActiveTime] = useState('0m');
  const [activeHours, setActiveHours] = useState(0);
  const [dailySpend, setDailySpend] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const acknowledgedTriggerRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize session tracker with Redis heartbeat
    const tracker = getSessionTracker();

    // Set up reality check callback (automatic 2-hour trigger)
    tracker.onRealityCheck((sessionData) => {
      // Update stats
      setActiveTime(tracker.getFormattedActiveTime());
      setActiveHours(tracker.getActiveHours());
      setDailySpend(getDailySpend());

      // Show modal
      setIsModalOpen(true);
    });

    // Update stats every 10 seconds for live display
    const statsInterval = setInterval(() => {
      setActiveTime(tracker.getFormattedActiveTime());
      setActiveHours(tracker.getActiveHours());
      setDailySpend(getDailySpend());
    }, 10000);

    // Connect to SSE stream for real-time Redis pub/sub triggers
    const connectSSE = () => {
      try {
        const eventSource = new EventSource('/api/reality-check/stream');
        eventSourceRef.current = eventSource;

        // Connection established
        eventSource.addEventListener('connected', (event) => {
          const data = JSON.parse(event.data);
          console.debug('Reality check stream connected:', data);
        });

        // Force trigger received from Redis pub/sub
        eventSource.addEventListener('trigger', async (event) => {
          const data = JSON.parse(event.data);
          console.debug('Reality check trigger received:', data);

          // Prevent duplicate triggers
          if (acknowledgedTriggerRef.current === data.triggerId) {
            return;
          }

          // Update stats
          setActiveTime(tracker.getFormattedActiveTime());
          setActiveHours(tracker.getActiveHours());
          setDailySpend(getDailySpend());

          // Show modal
          setIsModalOpen(true);

          // Mark trigger as seen (will acknowledge after modal completes)
          acknowledgedTriggerRef.current = data.triggerId;
        });

        // Session stats update
        eventSource.addEventListener('sessionStats', (event) => {
          const data = JSON.parse(event.data);
          console.debug('Session stats update:', data);
        });

        // Handle errors and reconnection
        eventSource.onerror = (error) => {
          console.error('Reality check SSE error:', error);
          eventSource.close();

          // Reconnect after 5 seconds
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              connectSSE();
            }
          }, 5000);
        };
      } catch (error) {
        console.error('Failed to connect to reality check stream:', error);
      }
    };

    // Start SSE connection
    connectSSE();

    // Cleanup
    return () => {
      clearInterval(statsInterval);

      // Close SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      tracker.stop();
    };
  }, []);

  const handleModalComplete = async () => {
    setIsModalOpen(false);

    // Acknowledge trigger to Redis (prevents re-showing)
    try {
      await fetch('/api/reality-check/acknowledge', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to acknowledge reality check:', error);
    }
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
