'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { usePwaPrompt } from '@/hooks/usePwaPrompt';

/**
 * PWA Install Prompt Component
 * 
 * Displays a banner when the app can be installed.
 * Users can dismiss it, and it won't show again for this session.
 */
export function PwaInstallPrompt() {
  const { canInstall, isInstalled, promptInstall } = usePwaPrompt();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }, []);

  // Check if dismissed in session storage
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    setIsRegistering(true);
    const installed = await promptInstall();
    if (installed) {
      setIsDismissed(true);
    }
    setIsRegistering(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed, dismissed, or can't install
  if (isInstalled || isDismissed || !canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-black/90 backdrop-blur-sm border border-cyan-400/50 rounded-lg p-4 shadow-lg shadow-cyan-400/20">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-cyan-400 mb-1">
              Install Apex Intelligence
            </h3>
            <p className="text-xs text-white/70 mb-3">
              Install our app for a faster, more focused experience with offline access.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                disabled={isRegistering}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/50 rounded text-cyan-400 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3" />
                {isRegistering ? 'Installing...' : 'Install'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-white/50 hover:text-white/70 text-xs transition-colors"
                aria-label="Dismiss"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/50 hover:text-white/70 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


