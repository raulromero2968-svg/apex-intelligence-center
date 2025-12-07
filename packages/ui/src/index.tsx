/**
 * @apex/ui - Apex Design System
 *
 * A React component library implementing the "Institutional Futurism" aesthetic.
 * Built with Atomic Design principles for scalable, consistent interfaces.
 *
 * Architecture:
 * - base/     Design tokens (colors, typography, spacing, shadows)
 * - atoms/    Primitives (Button, Input, Badge)
 * - molecules/ Composite (UserCard, IntelPreview)
 * - organisms/ Complex (MarketChart, DataGrid)
 * - lib/      Utilities (cn, formatters)
 */

// Design Tokens
export * from "./base";

// Utilities
export * from "./lib";

// Atomic Components (uncomment as components are created)
// export * from "./atoms";
// export * from "./molecules";
// export * from "./organisms";

// Version
export const version = "0.1.0";
