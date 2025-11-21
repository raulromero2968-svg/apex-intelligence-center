/**
 * useBreakMode Hook
 *
 * Provides break mode status to all components
 * Automatically refreshes every minute to update countdown
 */

import { useState, useEffect } from 'react';

export interface BreakModeState {
  isActive: boolean;
  expiresAt: string | null;
  activatedBy: 'child' | 'parent' | null;
  timeRemaining: string;
}

export function useBreakMode() {
  const [breakMode, setBreakMode] = useState<BreakModeState>({
    isActive: false,
    expiresAt: null,
    activatedBy: null,
    timeRemaining: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBreakModeStatus();

    // Refresh every minute to update countdown
    const interval = setInterval(fetchBreakModeStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchBreakModeStatus() {
    try {
      const response = await fetch('/api/break-mode');
      if (response.ok) {
        const data = await response.json();

        let timeRemaining = '';
        if (data.isActive && data.expiresAt) {
          const now = new Date();
          const expires = new Date(data.expiresAt);
          const diff = expires.getTime() - now.getTime();

          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            timeRemaining = `${hours}h ${minutes}m`;
          }
        }

        setBreakMode({
          ...data,
          timeRemaining,
        });
      }
    } catch (error) {
      console.error('Failed to fetch break mode status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    ...breakMode,
    isLoading,
    refresh: fetchBreakModeStatus,
  };
}
