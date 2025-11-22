/**
 * Holographic Icon Mapping
 * Maps icon IDs to their corresponding image paths in /public/icons/
 */

export const iconMap = {
  'portfolio-tracker': '/icons/holographic-icon-portfolio-tracker.png',
  'trade-calculator': '/icons/holographic-icon-trade-calculator.png',
  'grading-optimizer': '/icons/holographic-icon-grading-optimizer.png',
  'bulk-analyzer': '/icons/holographic-icon-bulk-analyzer.png',
  'reprint-predictor': '/icons/holographic-icon-reprint-predictor.png',
  'sealed-analyzer': '/icons/holographic-icon-sealed-analyzer.png',
  'tax-dashboard': '/icons/holographic-icon-tax-dashboard.png',
} as const;

export type IconId = keyof typeof iconMap;
