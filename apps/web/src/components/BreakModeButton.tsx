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
    <>
      {/* Dashboard Countdown Widget - Prominent banner at top when active */}
      {breakMode.isActive && (
        <div className="fixed top-16 left-0 right-0 z-[70] bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-xl border-y border-cyan-400/30">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Coffee className="h-12 w-12 text-cyan-400" />
                  <div className="absolute -inset-2 bg-cyan-400/30 blur-xl rounded-full animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-cyan-400">Break Mode Active</h2>
                  <p className="text-sm text-gray-300">
                    All notifications, price updates, and alerts paused
                  </p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-5xl font-bold text-white mb-1 font-mono tabular-nums">
                  {timeRemaining || 'Calculating...'}
                </div>
                <p className="text-sm text-gray-400">
                  Remaining • Activated by {breakMode.activatedBy}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Cannot be undone until timer expires
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {breakMode.isActive ? (
          // Active state - show smaller indicator
          <div className="group relative">
            <div className="glass-dark border-2 border-cyan-400/50 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Coffee className="h-6 w-6 text-cyan-400" />
                  <div className="absolute -inset-1 bg-cyan-400/20 blur-md rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-cyan-400">Break Mode</p>
                  <p className="text-xs text-gray-400">
                    {timeRemaining} left
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
          // Inactive state - MASSIVE friendly button
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
              className="relative group/btn glass-dark border-4 border-purple-400/50 hover:border-purple-400 rounded-3xl px-12 py-10 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-3">
                {isLoading ? (
                  <Loader2 className="h-16 w-16 text-purple-400 animate-spin" />
                ) : (
                  <>
                    <div className="relative">
                      <Coffee className="h-16 w-16 text-purple-400 group-hover/btn:text-purple-300 transition-colors" />
                      <div className="absolute -inset-3 bg-purple-400/30 blur-xl rounded-full group-hover/btn:bg-purple-400/40 transition-colors animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-purple-400 group-hover/btn:text-purple-300 transition-colors mb-1">
                        Take a Break
                      </p>
                      <p className="text-sm text-gray-300 font-semibold">
                        Pause everything for 24 hours
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        ⚠️ Cannot be undone
                      </p>
                    </div>
                  </>
                )}
              </div>
            </button>

            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-cyan-400/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 animate-pulse" />
          </div>
        )}
      </div>
    </>
  );
}
