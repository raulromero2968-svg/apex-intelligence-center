import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Apex Button Component
 *
 * A professional, trading-terminal-inspired button with subtle glow effects.
 * Part of the "Institutional Futurism" design system.
 *
 * Features:
 * - Electric Cyan glow on primary variant hover (satisfies "Innovative/Futuristic" brand requirement)
 * - Sharp corners (aerospace aesthetic)
 * - WCAG AA compliant focus states
 * - Reduced motion support
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
export type ButtonSize = "sm" | "default" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Shows loading spinner and disables interaction */
  isLoading?: boolean;
  /** Icon to display before the label */
  leftIcon?: React.ReactNode;
  /** Icon to display after the label */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-[#00F0FF] text-black border border-[#00F0FF]",
    // Hover: subtle glow effect (Innovative/Futuristic)
    "hover:bg-[#33F3FF] hover:shadow-[0_0_20px_rgba(0,240,255,0.4),0_0_40px_rgba(0,240,255,0.2)]",
    "hover:-translate-y-0.5",
    // Active state
    "active:translate-y-0 active:scale-[0.99]",
    // Focus state
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]",
    "focus-visible:shadow-[0_0_0_4px_rgba(0,240,255,0.2)]"
  ),
  secondary: cn(
    "bg-[#1E293B] text-[#F8FAFC] border border-[#1E293B]",
    "hover:bg-[#334155] hover:border-[#475569]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]"
  ),
  ghost: cn(
    "bg-transparent text-[#94A3B8] border border-transparent",
    "hover:bg-[#1E293B]/50 hover:text-[#F8FAFC]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]"
  ),
  destructive: cn(
    "bg-[#FF453A] text-white border border-[#FF453A]",
    "hover:bg-[#FF6961] hover:shadow-[0_0_20px_rgba(255,69,58,0.3)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF453A]"
  ),
  outline: cn(
    "bg-transparent text-[#00F0FF] border border-[#00F0FF]/30",
    "hover:bg-[#00F0FF]/10 hover:border-[#00F0FF]/50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]"
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  default: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
  icon: "h-11 w-11 p-0",
};

/**
 * Loading spinner component
 */
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spin", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
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

/**
 * Apex Button
 *
 * @example
 * // Primary button with glow effect
 * <Button variant="primary">Get Started</Button>
 *
 * @example
 * // Loading state
 * <Button variant="primary" isLoading>Processing...</Button>
 *
 * @example
 * // With icons
 * <Button variant="secondary" leftIcon={<PlusIcon />}>Add New</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center",
          "font-medium tracking-[0.01em]",
          "rounded-[0.25rem]", // Sharp corners - Aerospace aesthetic
          "transition-all duration-150 ease-out",
          // Disabled state
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
          // Reduced motion support
          "motion-reduce:transition-none motion-reduce:transform-none",
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          // Full width
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="h-4 w-4" />
            <span className="sr-only">Loading</span>
            {children && <span className="ml-2">{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
