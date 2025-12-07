/**
 * @apex/ui - Apex Design System
 *
 * A React component library implementing the "Institutional Futurism" aesthetic.
 * Built with Atomic Design principles for scalable, consistent interfaces.
 *
 * Architecture:
 * - base/     Design tokens (colors, typography, spacing, shadows)
 * - atoms/    Primitives (Button, Input, Badge)
 * - molecules/ Composite (UserCard, IntelCard)
 * - organisms/ Complex (MarketChart, DataGrid)
 * - lib/      Utilities (cn, formatters)
 */

// Design Tokens
export * from "./base";

// Utilities
export * from "./lib";

// Atomic Components
export * from "./atoms";
export * from "./molecules";
// export * from "./organisms"; // Uncomment when organisms are created

// Version
export const version = "0.1.0";
