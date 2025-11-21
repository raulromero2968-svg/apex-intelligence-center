'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, DollarSign, AlertTriangle } from 'lucide-react';

interface RealityCheckModalProps {
  isOpen: boolean;
  activeTime: string; // Formatted time string (e.g., "2h 15m")
  activeHours: number; // Decimal hours for display
  dailySpend: number; // Total spend today in dollars
  onComplete: () => void; // Called when countdown completes
}

const COUNTDOWN_SECONDS = 10;

/**
 * RealityCheckModal - Unskippable modal that forces users to take a break
 *
 * Features:
 * - 10 second countdown before dismissal
 * - Shows active session time
 * - Shows daily spending
 * - Cannot be closed via escape or backdrop click until countdown completes
 * - Forced via Redis pub/sub every 2 hours of active time
 */
export default function RealityCheckModal({
  isOpen,
  activeTime,
  activeHours,
  dailySpend,
  onComplete,
}: RealityCheckModalProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canClose, setCanClose] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(COUNTDOWN_SECONDS);
      setCanClose(false);

      // Lock body scroll
      document.body.style.overflow = 'hidden';

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanClose(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Prevent escape key from closing until countdown completes
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (canClose) {
          handleClose();
        } else {
          // Play error sound or show warning
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, canClose]);

  const handleClose = () => {
    if (!canClose) return;
    onComplete();
  };

  const handleBackdropClick = () => {
    if (canClose) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - cannot close until countdown completes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] cursor-not-allowed"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              ref={dialogRef}
              className="w-full max-w-md bg-gradient-to-br from-red-950/95 via-ink/95 to-red-950/95 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl shadow-2xl shadow-red-500/30 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="reality-check-title"
              aria-describedby="reality-check-description"
            >
              {/* Warning Header */}
              <div className="flex items-center justify-center gap-3 p-6 border-b border-red-500/30 bg-red-500/10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </motion.div>
                <h2
                  id="reality-check-title"
                  className="text-2xl font-bold text-white"
                >
                  Reality Check
                </h2>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                <p
                  id="reality-check-description"
                  className="text-lg text-white/90 text-center font-medium"
                >
                  Take a break. Step away from the screen.
                </p>

                {/* Session Stats */}
                <div className="space-y-4">
                  {/* Active Time */}
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-cyan-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-cyan-400" />
                      <div>
                        <p className="text-sm text-white/60">Session Time</p>
                        <p className="text-xl font-bold text-white">{activeTime}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">
                        {activeHours.toFixed(1)}h
                      </p>
                    </div>
                  </div>

                  {/* Daily Spend */}
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-yellow-400" />
                      <div>
                        <p className="text-sm text-white/60">Spend Today</p>
                        <p className="text-xl font-bold text-white">
                          ${dailySpend.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="flex flex-col items-center justify-center py-6">
                  {!canClose ? (
                    <>
                      <motion.div
                        key={countdown}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                      >
                        <div className="text-7xl font-bold text-white mb-2">
                          {countdown}
                        </div>
                        {/* Pulsing ring */}
                        <motion.div
                          className="absolute inset-0 border-4 border-red-400 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0, 1],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      </motion.div>
                      <p className="text-sm text-white/70 mt-4">
                        Please wait before continuing...
                      </p>
                    </>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <button
                        onClick={handleClose}
                        className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-white font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all transform hover:scale-105"
                      >
                        Continue Session
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Health Warning */}
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-300/80 text-center">
                    Prolonged screen time may affect your health. Consider taking regular breaks,
                    stretching, and staying hydrated.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-red-500/30 bg-red-500/5">
                <p className="text-xs text-white/50 text-center">
                  {canClose ? (
                    <>
                      Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Esc</kbd> or
                      click Continue to resume
                    </>
                  ) : (
                    'This reminder cannot be skipped'
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
