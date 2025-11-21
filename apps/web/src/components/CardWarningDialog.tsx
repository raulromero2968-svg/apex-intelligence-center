'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface CardWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  gainPercent: number;
  isManipulated: boolean;
  manipulationReason?: string;
}

export default function CardWarningDialog({
  isOpen,
  onClose,
  cardName,
  gainPercent,
  isManipulated,
  manipulationReason,
}: CardWarningDialogProps) {
  const [canClose, setCanClose] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(5);

  // Reset timer when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCanClose(false);
      setTimeRemaining(5);

      // Countdown timer
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canClose) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, canClose, onClose]);

  const handleClose = () => {
    if (canClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md bg-gradient-to-br from-orange-950/95 to-red-950/95 backdrop-blur-xl border-2 border-orange-500/50 rounded-xl shadow-2xl shadow-orange-500/30 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="warning-dialog-title"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-orange-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
                  <div>
                    <h2
                      id="warning-dialog-title"
                      className="text-2xl font-bold text-white"
                    >
                      High Risk Alert
                    </h2>
                    <p className="text-orange-200/80 text-sm mt-1">
                      Please read this important warning
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={!canClose}
                  className={`p-2 rounded-lg transition-colors ${
                    canClose
                      ? 'hover:bg-white/10 text-white/70 hover:text-white cursor-pointer'
                      : 'text-white/30 cursor-not-allowed'
                  }`}
                  aria-label={canClose ? 'Close dialog' : `Wait ${timeRemaining} seconds to close`}
                  title={canClose ? 'Close' : `Wait ${timeRemaining} seconds`}
                >
                  {canClose ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <span className="w-6 h-6 flex items-center justify-center text-sm font-bold">
                      {timeRemaining}
                    </span>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Card Info */}
                <div className="bg-black/30 rounded-lg p-4 border border-orange-500/30">
                  <p className="text-white font-semibold text-lg mb-1">{cardName}</p>
                  <p className="text-orange-300 font-bold text-2xl">
                    Up {gainPercent.toFixed(1)}%
                    {isManipulated && ' • Manipulation Detected'}
                  </p>
                </div>

                {/* Warning Message */}
                <div className="space-y-3">
                  <p className="text-white text-base leading-relaxed">
                    This card is up <strong className="text-orange-300">{gainPercent.toFixed(0)}%</strong> in
                    the last 7 days.
                  </p>
                  <p className="text-white text-base leading-relaxed">
                    Historically, <strong className="text-orange-300">89% of such moves reverse within 30 days</strong>.
                  </p>
                  <p className="text-orange-200 text-lg font-semibold mt-4">
                    Consider waiting.
                  </p>

                  {/* Manipulation Warning */}
                  {isManipulated && manipulationReason && (
                    <div className="mt-4 p-4 bg-red-900/40 border border-red-500/50 rounded-lg">
                      <p className="text-red-200 font-semibold mb-1">
                        Market Manipulation Detected
                      </p>
                      <p className="text-red-200/80 text-sm">{manipulationReason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleClose}
                    disabled={!canClose}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      canClose
                        ? 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer shadow-lg shadow-orange-500/30'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canClose ? 'I Understand' : `Please wait ${timeRemaining}s`}
                  </button>
                </div>

                {/* Educational Note */}
                <p className="text-white/50 text-xs text-center mt-4">
                  This message is for educational purposes and does not constitute financial advice.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
