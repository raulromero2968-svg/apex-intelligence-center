/**
 * @apex/ui - Apex Design System
 *
 * A React component library implementing the "Aerospace Dark" aesthetic.
 * Built with Atomic Design principles for scalable, consistent interfaces.
 *
 * Architecture:
 * - base/      Design tokens (colors, typography, spacing, shadows)
 * - atoms/     Primitives (Button, Badge, Skeleton)
 * - molecules/ Composite (IntelCard)
 * - organisms/ Complex (MarketChart, DataGrid)
 * - lib/       Utilities (cn, formatters)
 *
 * Design Philosophy:
 * - "Institutional Futurism" meets "Aerospace Dark"
 * - Buttons are triggers for value creation
 * - Cards are containers of wealth
 * - Every interaction should feel like a cockpit command
 */

// Design Tokens
export * from "./base";

// Utilities
export * from "./lib";

// ═══════════════════════════════════════════════════════════════════
// ATOMIC COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// Atoms - The smallest building blocks
export * from "./atoms";

// Molecules - Composite patterns
export * from "./molecules";

// Organisms (uncomment as components are created)
// export * from "./organisms";

// Version
export const version = "0.2.0";
