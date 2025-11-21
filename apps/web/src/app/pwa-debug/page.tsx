'use client';

import { useState, useEffect } from 'react';
import { Check, X, Download, Smartphone, Monitor, Globe } from 'lucide-react';
import { usePwaPrompt } from '@/hooks/usePwaPrompt';

interface PwaStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  hasServiceWorker: boolean;
  serviceWorkerState: string | null;
  canInstall: boolean;
  userAgent: string;
  platform: string;
}

export default function PwaDebugPage() {
  const { canInstall, isInstalled, promptInstall } = usePwaPrompt();
  const [status, setStatus] = useState<PwaStatus>({
    isInstalled: false,
    isStandalone: false,
    hasServiceWorker: false,
    serviceWorkerState: null,
    canInstall: false,
    userAgent: '',
    platform: '',
  });
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      let swState: string | null = null;
      let hasSW = false;

      if ('serviceWorker' in navigator) {
        hasSW = true;
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            if (registration.active) {
              swState = 'active';
            } else if (registration.installing) {
              swState = 'installing';
            } else if (registration.waiting) {
              swState = 'waiting';
            } else {
              swState = 'registered';
            }
          } else {
            swState = 'not registered';
          }
        } catch (error) {
          swState = 'error';
        }
      }

      setStatus({
        isInstalled,
        isStandalone,
        hasServiceWorker: hasSW,
        serviceWorkerState: swState,
        canInstall,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, [isInstalled, canInstall]);

  const handleInstall = async () => {
    setIsInstalling(true);
    await promptInstall();
    setIsInstalling(false);
  };

  const getInstallInstructions = () => {
    const ua = navigator.userAgent.toLowerCase();
    
    if (ua.includes('iphone') || ua.includes('ipad')) {
      return {
        title: 'Install on iOS',
        steps: [
          'Tap the Share button (square with arrow)',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to confirm',
        ],
        icon: Smartphone,
      };
    }
    
    if (ua.includes('android')) {
      return {
        title: 'Install on Android',
        steps: [
          'Tap the menu (three dots) in your browser',
          'Select "Add to Home screen" or "Install app"',
          'Tap "Install" to confirm',
        ],
        icon: Smartphone,
      };
    }
    
    if (ua.includes('chrome') || ua.includes('edge')) {
      return {
        title: 'Install on Desktop',
        steps: [
          'Look for the install icon in the address bar',
          'Or use the install button above if available',
          'Click "Install" in the prompt',
        ],
        icon: Monitor,
      };
    }
    
    return {
      title: 'Install Instructions',
      steps: [
        'Look for an install prompt or menu option',
        'Follow your browser\'s installation instructions',
      ],
      icon: Globe,
    };
  };

  const instructions = getInstallInstructions();
  const Icon = instructions.icon;

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">PWA Debug & Status</h1>
          <p className="text-white/70">
            Check your Progressive Web App installation status and get help installing.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-cyan-400/50 rounded-lg p-6 bg-black/40">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Installation Status
            </h2>
            <div className="space-y-3">
              <StatusItem
                label="App Installed"
                value={status.isInstalled}
                description={status.isInstalled ? 'App is installed' : 'App is not installed'}
              />
              <StatusItem
                label="Standalone Mode"
                value={status.isStandalone}
                description={status.isStandalone ? 'Running in standalone mode' : 'Running in browser'}
              />
              <StatusItem
                label="Can Install"
                value={status.canInstall}
                description={status.canInstall ? 'Install prompt available' : 'Install prompt not available'}
              />
            </div>
          </div>

          <div className="border border-cyan-400/50 rounded-lg p-6 bg-black/40">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Service Worker Status
            </h2>
            <div className="space-y-3">
              <StatusItem
                label="Service Worker Support"
                value={status.hasServiceWorker}
                description={status.hasServiceWorker ? 'Browser supports service workers' : 'Browser does not support service workers'}
              />
              <div>
                <span className="text-sm text-white/70">State: </span>
                <span className="text-sm font-medium text-cyan-400">
                  {status.serviceWorkerState || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Install Button */}
        {status.canInstall && !status.isInstalled && (
          <div className="border border-cyan-400/50 rounded-lg p-6 bg-black/40">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/50 rounded-lg text-cyan-400 font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {isInstalling ? 'Installing...' : 'Install App'}
            </button>
          </div>
        )}

        {/* Installation Instructions */}
        <div className="border border-cyan-400/50 rounded-lg p-6 bg-black/40">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {instructions.title}
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-white/70">
            {instructions.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Technical Details */}
        <div className="border border-cyan-400/50 rounded-lg p-6 bg-black/40">
          <h2 className="text-lg font-semibold mb-4">Technical Details</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-white/70">User Agent: </span>
              <span className="text-white/90 font-mono text-xs break-all">
                {status.userAgent}
              </span>
            </div>
            <div>
              <span className="text-white/70">Platform: </span>
              <span className="text-white/90">{status.platform}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  value,
  description,
}: {
  label: string;
  value: boolean;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-white/50">{description}</div>
      </div>
      {value ? (
        <Check className="w-5 h-5 text-green-400" />
      ) : (
        <X className="w-5 h-5 text-red-400" />
      )}
    </div>
  );
}


