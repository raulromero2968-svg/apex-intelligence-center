'use client';

import { useState, useEffect } from 'react';
import { Coffee, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BreakModeState {
  isActive: boolean;
  expiresAt: string | null;
  activatedBy: 'child' | 'parent' | null;
}

export function BreakModeButton() {
  const [breakMode, setBreakMode] = useState<BreakModeState>({
    isActive: false,
    expiresAt: null,
    activatedBy: null,
  });
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch current break mode status
  useEffect(() => {
    fetchBreakModeStatus();
  }, []);

  // Update countdown every minute
  useEffect(() => {
    if (!breakMode.isActive || !breakMode.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const expires = new Date(breakMode.expiresAt!);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setBreakMode({ isActive: false, expiresAt: null, activatedBy: null });
        setTimeRemaining('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [breakMode.isActive, breakMode.expiresAt]);

  async function fetchBreakModeStatus() {
    try {
      const response = await fetch('/api/break-mode');
      if (response.ok) {
        const data = await response.json();
        setBreakMode(data);
      }
    } catch (error) {
      console.error('Failed to fetch break mode status:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }

  async function activateBreakMode(activatedBy: 'child' | 'parent') {
    setIsLoading(true);
    try {
      const response = await fetch('/api/break-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activatedBy }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate break mode');
      }

      const data = await response.json();
      setBreakMode(data);

      toast.success('Break Mode Activated! 🌟', {
        description: 'All notifications paused for 24 hours. You cannot undo this.',
        duration: 5000,
      });
    } catch (error) {
      toast.error('Failed to activate break mode', {
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isInitialLoading) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2">
      {breakMode.isActive ? (
        // Active state - show countdown
        <div className="group relative">
          <div className="glass-dark border-2 border-cyan-400/50 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Coffee className="h-6 w-6 text-cyan-400" />
                <div className="absolute -inset-1 bg-cyan-400/20 blur-md rounded-full animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-cyan-400">Break Mode Active</p>
                <p className="text-xs text-gray-400">
                  {timeRemaining} remaining
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Activated by {breakMode.activatedBy}
                </p>
              </div>
            </div>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="glass-dark border border-cyan-400/30 rounded-lg px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
              All notifications paused. Cannot be undone.
            </div>
          </div>
        </div>
      ) : (
        // Inactive state - show big friendly button
        <div className="group relative">
          <button
            onClick={() => {
              // Show role selection
              const role = window.confirm(
                'Who is activating break mode?\n\nClick OK for Parent, Cancel for Child'
              ) ? 'parent' : 'child';

              const confirmed = window.confirm(
                `⚠️ This will pause ALL notifications for 24 hours.\n\nThis action CANNOT be undone.\n\nAre you sure you want to continue?`
              );

              if (confirmed) {
                activateBreakMode(role);
              }
            }}
            disabled={isLoading}
            className="relative group/btn glass-dark border-2 border-purple-400/50 hover:border-purple-400 rounded-2xl px-8 py-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
              ) : (
                <>
                  <div className="relative">
                    <Coffee className="h-8 w-8 text-purple-400 group-hover/btn:text-purple-300 transition-colors" />
                    <div className="absolute -inset-2 bg-purple-400/20 blur-lg rounded-full group-hover/btn:bg-purple-400/30 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-400 group-hover/btn:text-purple-300 transition-colors">
                      Take a Break
                    </p>
                    <p className="text-xs text-gray-400">
                      Pause all notifications for 24h
                    </p>
                  </div>
                </>
              )}
            </div>
          </button>

          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
        </div>
      )}
    </div>
  );
}
