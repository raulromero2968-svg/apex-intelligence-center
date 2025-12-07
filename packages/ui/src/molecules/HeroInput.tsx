import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "../atoms/Button";

/**
 * Hero Input - The "Aha Moment" Entry Point
 *
 * Design Rationale:
 * - Massive, glowing input field (like Google Search)
 * - Signals: "This is the primary action"
 * - Glow intensifies on focus (readiness indicator)
 * - Supports URL paste detection for instant analysis
 */

export interface HeroInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Current input value */
  value?: string;
  /** Value change handler */
  onChange?: (value: string) => void;
  /** Submit handler */
  onSubmit?: (value: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Whether a valid URL was detected */
  urlDetected?: boolean;
  /** Error message */
  error?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * HeroInput - The gateway to intelligence
 *
 * This component is the first interaction point in the Guest Mode flow.
 * It creates the "Aha Moment" by immediately showing value from a simple URL paste.
 *
 * @example
 * ```tsx
 * <HeroInput
 *   placeholder="Paste any URL to generate intelligence..."
 *   onSubmit={(url) => generateIntel(url)}
 *   loading={isAnalyzing}
 * />
 * ```
 */
export function HeroInput({
  placeholder = "Paste any URL to unlock intelligence...",
  value,
  onChange,
  onSubmit,
  loading = false,
  urlDetected = false,
  error,
  className,
}: HeroInputProps) {
  const [internalValue, setInternalValue] = React.useState(value ?? "");
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const currentValue = value ?? internalValue;

  // Detect URL pattern
  const isUrl = React.useMemo(() => {
    try {
      if (!currentValue) return false;
      new URL(currentValue);
      return true;
    } catch {
      // Check for partial URL patterns
      return /^(https?:\/\/|www\.)/.test(currentValue);
    }
  }, [currentValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentValue && !loading) {
      onSubmit?.(currentValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text");
    // Auto-submit on valid URL paste
    try {
      new URL(pastedText);
      setTimeout(() => onSubmit?.(pastedText), 100);
    } catch {
      // Not a URL, just paste normally
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div
        className={cn(
          // Container styling
          "relative flex items-center gap-2",
          "rounded-xl border-2 bg-card/50 backdrop-blur-sm",
          "transition-all duration-300 ease-out",
          // Default state
          "border-border/50 shadow-lg",
          // Focus state - plasma glow effect
          isFocused && [
            "border-primary/60",
            "shadow-[0_0_30px_rgba(0,240,255,0.15),0_0_60px_rgba(0,240,255,0.05)]",
          ],
          // URL detected state
          (isUrl || urlDetected) && [
            "border-primary/80",
            "shadow-[0_0_40px_rgba(0,240,255,0.2)]",
          ],
          // Error state
          error && "border-destructive/60 shadow-[0_0_20px_rgba(255,69,58,0.15)]"
        )}
      >
        {/* Scan line indicator */}
        <div
          className={cn(
            "absolute left-4 h-5 w-0.5 rounded-full bg-primary transition-opacity",
            isFocused ? "animate-pulse opacity-100" : "opacity-0"
          )}
        />

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          onChange={handleChange}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={loading}
          className={cn(
            "flex-1 bg-transparent px-6 py-5 text-lg",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // URL detected styling
            (isUrl || urlDetected) && "text-primary"
          )}
        />

        {/* Submit button */}
        <div className="pr-3">
          <Button
            type="submit"
            variant={isUrl || urlDetected ? "default" : "terminal"}
            disabled={!currentValue || loading}
            className={cn(
              "h-12 px-6",
              (isUrl || urlDetected) && "animate-pulse"
            )}
          >
            {loading ? (
              <>
                <LoadingDots />
                <span className="ml-2">Analyzing</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <svg
                  className="ml-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Helper text / Error */}
      <div className="mt-3 flex items-center justify-between px-2">
        {error ? (
          <span className="text-sm text-destructive">{error}</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {isUrl || urlDetected
              ? "Valid URL detected. Press Enter or click Analyze."
              : "Paste a URL from Twitter, news articles, or any public source."}
          </span>
        )}

        {(isUrl || urlDetected) && !error && (
          <span className="flex items-center gap-1 text-xs text-primary">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="10" opacity="0.2" />
              <path d="M9 12l2 2 4-4" stroke="currentColor" fill="none" strokeWidth="2" />
            </svg>
            Ready
          </span>
        )}
      </div>
    </form>
  );
}

/**
 * Loading dots animation
 */
function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HERO SECTION WRAPPER
// ═══════════════════════════════════════════════════════════════════

export interface HeroSectionProps {
  /** Main headline */
  headline?: string;
  /** Supporting subheadline */
  subheadline?: string;
  /** Hero input props */
  inputProps?: HeroInputProps;
  /** Additional content below input */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * HeroSection - Complete hero block with input
 *
 * This is the full "Aha Moment" section for guest onboarding.
 *
 * @example
 * ```tsx
 * <HeroSection
 *   headline="Turn any URL into actionable intelligence"
 *   subheadline="Paste a link. Get a report. Earn credits."
 *   inputProps={{
 *     onSubmit: handleAnalyze,
 *     loading: isLoading,
 *   }}
 * />
 * ```
 */
export function HeroSection({
  headline = "Turn any URL into actionable intelligence",
  subheadline = "Paste a link. Get a report. Earn credits.",
  inputProps,
  children,
  className,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative flex flex-col items-center justify-center",
        "px-4 py-16 md:py-24 lg:py-32",
        "text-center",
        className
      )}
    >
      {/* Background glow effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl space-y-8">
        {/* Headlines */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground md:text-xl">
            {subheadline}
          </p>
        </div>

        {/* Hero Input */}
        <HeroInput {...inputProps} />

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            256-bit encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
            10 free credits on signup
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            4.9/5 analyst rating
          </span>
        </div>

        {/* Additional content slot */}
        {children}
      </div>
    </section>
  );
}

export default HeroInput;
