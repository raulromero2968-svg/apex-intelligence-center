import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/**
 * Apex Button Variants
 *
 * Design Rationale:
 * - "Contained Plasma" glow effect on hover signals readiness
 * - All caps, wide tracking mimics cockpit switch labels
 * - Active state flash confirms command received
 * - Terminal variant for data table actions (monospace, technical)
 */
const buttonVariants = cva(
  // Base styles - all buttons share these
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-md text-sm font-medium",
    "ring-offset-background transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98] active:brightness-125", // Micro-interaction: flash on click
  ],
  {
    variants: {
      variant: {
        // Primary: Cyan glow effect on hover
        default: [
          "bg-primary text-primary-foreground font-semibold uppercase tracking-wider",
          "hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]",
          "active:shadow-[0_0_30px_rgba(0,240,255,0.6)]",
        ],

        // Destructive: Red alert styling
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90 hover:shadow-[0_0_15px_rgba(255,69,58,0.3)]",
        ],

        // Outline: Subtle border, fills on hover
        outline: [
          "border border-border bg-transparent text-foreground",
          "hover:bg-accent hover:text-accent-foreground hover:border-primary/50",
        ],

        // Secondary: Muted, solid background
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80",
        ],

        // Ghost: No background until hover
        ghost: [
          "text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
        ],

        // Link: Text-only, underline on hover
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
        ],

        // Terminal: Data action style (monospace, technical aesthetic)
        terminal: [
          "bg-transparent border border-primary/20 text-primary",
          "font-mono text-xs uppercase tracking-widest",
          "hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_10px_rgba(0,240,255,0.2)]",
          "active:bg-primary/20",
        ],

        // Stealth: Minimal presence, appears on hover
        stealth: [
          "bg-transparent text-muted-foreground",
          "hover:text-foreground hover:bg-muted/50",
        ],

        // Premium: Purple accent for premium actions
        premium: [
          "bg-[#7000FF] text-white font-semibold uppercase tracking-wider",
          "hover:bg-[#7000FF]/90 hover:shadow-[0_0_20px_rgba(112,0,255,0.4)]",
          "active:shadow-[0_0_30px_rgba(112,0,255,0.6)]",
        ],
      },

      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Slot component for "asChild" pattern
const Slot = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }
>(({ children, ...props }, ref) => {
  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ...(children.props as Record<string, unknown>),
      ref,
    } as React.HTMLAttributes<HTMLElement>);
  }
  return null;
});
Slot.displayName = "Slot";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * If true, the button will render as its child element,
   * merging props and forwarding the ref.
   */
  asChild?: boolean;
  /**
   * Optional loading state
   */
  loading?: boolean;
}

/**
 * Apex Button - The trigger for value creation
 *
 * A button component designed with the "Aerospace Dark" aesthetic.
 * Each press is a commitment - the glow signals readiness,
 * the flash confirms the command.
 *
 * @example
 * ```tsx
 * // Primary action with cyan glow
 * <Button>Unlock Intel</Button>
 *
 * // Terminal style for data actions
 * <Button variant="terminal">Execute</Button>
 *
 * // As a link
 * <Button asChild>
 *   <a href="/dashboard">Dashboard</a>
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            <span className="opacity-70">{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

/**
 * Loading spinner with aerospace styling
 */
function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export { Button, buttonVariants };
