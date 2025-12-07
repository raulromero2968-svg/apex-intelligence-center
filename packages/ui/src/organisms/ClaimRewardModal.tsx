import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "../atoms/Button";
import { ReputationBadge } from "../molecules/ReputationBadge";
import { ReputationTicker } from "../molecules/ReputationTicker";

/**
 * ClaimRewardModal - The "Anti-Confetti" Reward Experience
 *
 * Design Philosophy:
 * - This is NOT a slot machine celebration
 * - This IS a "System Upgrade" confirmation
 * - Terminal aesthetics: text types out, progress fills, border glows
 * - The experience must feel like a Bank Ledger Update
 *
 * Interaction Flow:
 * 1. User clicks "Claim" on Intel Card
 * 2. Modal appears with "System Upgrade" aesthetic
 * 3. RC badge animates from source position to "Wallet"
 * 4. Terminal text types: "> TRANSFER COMPLETE"
 * 5. Hook message: "You just earned X RC. First step toward economic independence."
 *
 * Psychological Design:
 * - Shows USD equivalent subtly (anchoring the hybrid economy)
 * - No confetti, sparkles, or cheap gamification
 * - Permanent, weighty feel
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ClaimRewardModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** RC amount being claimed */
  rcAmount: number;
  /** USD equivalent (for psychological anchoring) */
  usdEquivalent: number;
  /** User's current RC balance (before this claim) */
  currentBalance: number;
  /** Title of what was claimed (e.g., "Market Analysis Report") */
  claimedItemTitle?: string;
  /** Whether this is the user's first claim (triggers welcome message) */
  isFirstClaim?: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when user clicks "View Report" or next action */
  onViewItem?: () => void;
  /** Callback when user clicks "Create Account" (for anonymous users) */
  onCreateAccount?: () => void;
  /** Whether user is anonymous (triggers account creation CTA) */
  isAnonymous?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATION STAGES
// ═══════════════════════════════════════════════════════════════════

type AnimationStage =
  | "entering"
  | "transferring"
  | "confirming"
  | "complete";

// ═══════════════════════════════════════════════════════════════════
// TERMINAL TEXT ANIMATION HOOK
// ═══════════════════════════════════════════════════════════════════

function useTerminalText(
  text: string,
  options?: { delay?: number; speed?: number; enabled?: boolean }
) {
  const { delay = 0, speed = 30, enabled = true } = options ?? {};
  const [displayText, setDisplayText] = React.useState("");
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setDisplayText("");
      setIsComplete(false);
      return;
    }

    setDisplayText("");
    setIsComplete(false);

    const startTimeout = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, delay, speed, enabled]);

  return { displayText, isComplete };
}

// ═══════════════════════════════════════════════════════════════════
// PROGRESS BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════

function TransferProgress({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-muted/30",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 bg-primary transition-all duration-300 ease-out",
          "shadow-[0_0_10px_rgba(0,240,255,0.5)]"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TERMINAL LINE COMPONENT
// ═══════════════════════════════════════════════════════════════════

function TerminalLine({
  prefix = ">",
  text,
  typing = false,
  success = false,
  className,
}: {
  prefix?: string;
  text: string;
  typing?: boolean;
  success?: boolean;
  className?: string;
}) {
  const { displayText, isComplete } = useTerminalText(text, {
    enabled: typing,
    speed: 25,
  });

  const displayedText = typing ? displayText : text;

  return (
    <div
      className={cn(
        "font-mono text-sm flex items-center gap-2",
        success && isComplete && "text-emerald-400",
        className
      )}
    >
      <span className="text-primary/50">{prefix}</span>
      <span>{displayedText}</span>
      {typing && !isComplete && (
        <span className="animate-pulse text-primary">▊</span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

/**
 * ClaimRewardModal - System upgrade aesthetic for claiming RC
 *
 * @example
 * ```tsx
 * <ClaimRewardModal
 *   isOpen={showClaimModal}
 *   rcAmount={10}
 *   usdEquivalent={1.00}
 *   currentBalance={240}
 *   claimedItemTitle="Apple Vision Pro Supply Chain Analysis"
 *   isFirstClaim
 *   isAnonymous
 *   onClose={() => setShowClaimModal(false)}
 *   onViewItem={() => router.push('/intel/123')}
 *   onCreateAccount={() => router.push('/signup')}
 * />
 * ```
 */
export function ClaimRewardModal({
  isOpen,
  rcAmount,
  usdEquivalent,
  currentBalance,
  claimedItemTitle,
  isFirstClaim = false,
  onClose,
  onViewItem,
  onCreateAccount,
  isAnonymous = false,
  className,
}: ClaimRewardModalProps) {
  const [stage, setStage] = React.useState<AnimationStage>("entering");
  const [transferProgress, setTransferProgress] = React.useState(0);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Lifecycle management
  React.useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setStage("entering");
      setTransferProgress(0);

      // Lock body scroll
      document.body.style.overflow = "hidden";

      // Start animation sequence
      const sequence = [
        { delay: 300, action: () => setStage("transferring") },
        { delay: 600, action: () => setTransferProgress(25) },
        { delay: 900, action: () => setTransferProgress(50) },
        { delay: 1200, action: () => setTransferProgress(75) },
        { delay: 1500, action: () => setTransferProgress(100) },
        { delay: 1800, action: () => setStage("confirming") },
        { delay: 2500, action: () => setStage("complete") },
      ];

      const timers = sequence.map(({ delay, action }) =>
        setTimeout(action, delay)
      );

      return () => {
        timers.forEach(clearTimeout);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // Escape key handler
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && stage === "complete") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, stage, onClose]);

  // Focus trap
  React.useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const newBalance = currentBalance + rcAmount;

  // Messages based on context
  const hookMessage = isFirstClaim
    ? "You just earned your first RC. This is your first step toward economic independence."
    : `+${rcAmount} RC deposited. Your contributions build wealth.`;

  const terminalMessages = {
    entering: "INITIALIZING TRANSFER...",
    transferring: "TRANSFERRING RC TO WALLET...",
    confirming: "VERIFYING TRANSACTION...",
    complete: "TRANSFER COMPLETE",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={stage === "complete" ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed inset-0 z-[101] flex items-center justify-center p-4",
          "pointer-events-none"
        )}
      >
        <div
          ref={dialogRef}
          className={cn(
            "w-full max-w-md pointer-events-auto",
            "bg-gradient-to-br from-black via-[#060A10] to-black",
            "border rounded-xl overflow-hidden",
            "transition-all duration-500",
            // Glow effect based on stage
            stage === "complete"
              ? "border-primary/50 shadow-[0_0_40px_rgba(0,240,255,0.2)]"
              : "border-border/50",
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-modal-title"
          tabIndex={-1}
        >
          {/* Header - System Status */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/10">
            <div className="flex items-center gap-3">
              {/* Status indicator */}
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-300",
                  stage === "complete"
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : "bg-primary animate-pulse"
                )}
              />
              <h2
                id="claim-modal-title"
                className="font-mono text-sm text-muted-foreground uppercase tracking-wider"
              >
                Reputation Credit Transfer
              </h2>
            </div>

            {/* Close button (only visible when complete) */}
            {stage === "complete" && (
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </header>

          {/* Main Content */}
          <div className="p-6 space-y-6">
            {/* Transfer Visualization */}
            <div className="flex flex-col items-center space-y-4">
              {/* RC Badge - The "star" of the show */}
              <div
                className={cn(
                  "transition-all duration-700 transform",
                  stage === "entering" && "scale-100 opacity-100",
                  stage === "transferring" && "scale-110 opacity-80",
                  stage === "confirming" && "scale-100 opacity-100",
                  stage === "complete" && "scale-100 opacity-100"
                )}
              >
                <ReputationBadge
                  amount={rcAmount}
                  variant={stage === "complete" ? "earned" : "potential"}
                  size="lg"
                  showPrefix={stage === "complete"}
                  showIcon
                />
              </div>

              {/* USD Equivalent - Psychological anchor */}
              <span className="text-xs text-muted-foreground/60 font-mono">
                ≈ ${usdEquivalent.toFixed(2)} USD
              </span>
            </div>

            {/* Transfer Progress Bar */}
            <div className="space-y-2">
              <TransferProgress progress={transferProgress} />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>Source</span>
                <span>Wallet</span>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="bg-black/50 rounded-lg p-4 border border-border/30 space-y-2 min-h-[80px]">
              <TerminalLine
                text={terminalMessages[stage]}
                typing={stage !== "complete"}
                success={stage === "complete"}
              />

              {stage === "complete" && claimedItemTitle && (
                <TerminalLine
                  prefix="→"
                  text={`"${claimedItemTitle}"`}
                  className="text-muted-foreground text-xs"
                />
              )}
            </div>

            {/* Balance Update (visible when complete) */}
            {stage === "complete" && (
              <div
                className={cn(
                  "flex items-center justify-between p-4",
                  "bg-primary/5 border border-primary/20 rounded-lg",
                  "animate-[fadeIn_300ms_ease-out]"
                )}
              >
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    New Balance
                  </span>
                  <ReputationTicker
                    value={newBalance}
                    previousValue={currentBalance}
                    size="lg"
                    animationDuration={1000}
                  />
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground/60 font-mono">
                    ≈ ${(newBalance * 0.1).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Hook Message (visible when complete) */}
            {stage === "complete" && (
              <p className="text-sm text-center text-muted-foreground leading-relaxed">
                {hookMessage}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <footer className="px-6 py-4 border-t border-border/50 bg-muted/5">
            {stage === "complete" ? (
              <div className="flex flex-col gap-3">
                {/* Primary CTA */}
                {isAnonymous ? (
                  <Button onClick={onCreateAccount} className="w-full">
                    Create Account to Keep RC
                  </Button>
                ) : onViewItem ? (
                  <Button onClick={onViewItem} className="w-full">
                    View Report
                    <svg
                      className="w-4 h-4 ml-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Button>
                ) : (
                  <Button onClick={onClose} className="w-full">
                    Continue
                  </Button>
                )}

                {/* Secondary CTA for anonymous users */}
                {isAnonymous && onViewItem && (
                  <Button variant="ghost" onClick={onViewItem} className="w-full">
                    Continue as Guest
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-2">
                <span className="text-xs text-muted-foreground animate-pulse">
                  Processing transaction...
                </span>
              </div>
            )}
          </footer>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// QUICK TOAST VARIANT
// ═══════════════════════════════════════════════════════════════════

export interface RewardToastProps {
  /** RC amount earned */
  rcAmount: number;
  /** Action that triggered the reward */
  action?: string;
  /** Whether the toast is visible */
  isVisible: boolean;
  /** Auto-dismiss duration in ms */
  duration?: number;
  /** Callback when toast dismisses */
  onDismiss: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * RewardToast - Quick, non-blocking reward notification
 *
 * For smaller, frequent rewards where a full modal would be
 * disruptive. Appears in the corner and auto-dismisses.
 *
 * @example
 * ```tsx
 * <RewardToast
 *   rcAmount={5}
 *   action="Daily login"
 *   isVisible={showToast}
 *   onDismiss={() => setShowToast(false)}
 * />
 * ```
 */
export function RewardToast({
  rcAmount,
  action,
  isVisible,
  duration = 4000,
  onDismiss,
  className,
}: RewardToastProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[90]",
        "flex items-center gap-3 px-4 py-3",
        "bg-gradient-to-r from-[#060A10] to-[#0A0F16]",
        "border border-primary/30 rounded-lg",
        "shadow-lg shadow-primary/10",
        "animate-[slideInUp_300ms_ease-out]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <ReputationBadge
        amount={rcAmount}
        variant="earned"
        size="sm"
        showPrefix
      />
      {action && (
        <span className="text-sm text-muted-foreground">{action}</span>
      )}
      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground ml-2"
        aria-label="Dismiss"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default ClaimRewardModal;
