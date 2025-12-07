import type { Meta, StoryObj } from '@storybook/react';
import { HoloCard } from './HoloCard';

/**
 * # HoloCard
 *
 * High-emphasis glassmorphism container with the "Aerospace Dark Mode" aesthetic.
 *
 * ## Design Philosophy
 *
 * The HoloCard is designed to draw attention while maintaining the sophisticated,
 * muted aesthetic of a Bloomberg Terminal or SpaceX Mission Control interface.
 *
 * ## Usage
 *
 * Use HoloCard for:
 * - Subscription forms and CTAs
 * - Featured content that needs emphasis
 * - Modal content containers
 * - Important data displays
 *
 * ## Intensity Levels
 *
 * - **Low**: Subtle glow, use for secondary information
 * - **Medium**: Balanced emphasis, default for most use cases
 * - **High**: Maximum attention, use sparingly for critical actions
 */
const meta: Meta<typeof HoloCard> = {
  title: 'Components/Containers/HoloCard',
  component: HoloCard,
  tags: ['autodocs'],
  argTypes: {
    intensity: {
      control: 'select',
      options: ['low', 'medium', 'high'],
      description: 'Visual intensity level of the card',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    children: {
      control: 'text',
      description: 'Card content',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A glassmorphism container with animated breathing borders and HUD-style corner accents.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HoloCard>;

// =============================================================================
// STORIES
// =============================================================================

/**
 * Default HoloCard with medium intensity.
 * This is the recommended default for most use cases.
 */
export const Default: Story = {
  args: {
    intensity: 'medium',
    children: (
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Welcome to Apex Intelligence
        </h3>
        <p className="text-slate-400 text-sm">
          Your TCG market intelligence platform
        </p>
      </div>
    ),
  },
};

/**
 * Low intensity for secondary information.
 * Use when you need subtle emphasis without stealing focus.
 */
export const LowIntensity: Story = {
  args: {
    intensity: 'low',
    children: (
      <div className="text-center">
        <p className="text-slate-400 text-sm">Secondary information panel</p>
      </div>
    ),
  },
};

/**
 * High intensity for critical actions.
 * Use sparingly - this is maximum emphasis.
 */
export const HighIntensity: Story = {
  args: {
    intensity: 'high',
    children: (
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-3">CRITICAL ALERT</h3>
        <p className="text-cyan-400 text-sm">Price spike detected</p>
      </div>
    ),
  },
};

/**
 * Example of a subscription CTA using HoloCard.
 */
export const SubscriptionCTA: Story = {
  args: {
    intensity: 'medium',
    children: (
      <div className="space-y-4 max-w-sm">
        <div className="text-center">
          <span className="text-xs font-medium tracking-wider text-cyan-400 uppercase">
            Pro Tier
          </span>
          <h3 className="text-2xl font-bold text-white mt-1">$19/month</h3>
          <p className="text-slate-400 text-sm mt-2">
            Real-time market intelligence
          </p>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-cyan-400">✓</span>
            <span className="text-slate-300">Unlimited transformations</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-cyan-400">✓</span>
            <span className="text-slate-300">Priority processing</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-cyan-400">✓</span>
            <span className="text-slate-300">Voice commentary</span>
          </li>
        </ul>
        <button className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-lg transition-colors">
          Subscribe Now
        </button>
      </div>
    ),
  },
};

/**
 * Data display example showing the Human vs AI text distinction.
 */
export const DataDisplay: Story = {
  args: {
    intensity: 'medium',
    children: (
      <div className="space-y-4 min-w-[300px]">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Market Cap</span>
          <span className="text-white font-mono font-semibold">$2.4B</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">24h Change</span>
          <span className="text-positive font-mono font-semibold">+5.23%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Volume</span>
          <span className="text-white font-mono font-semibold">$142M</span>
        </div>
        <div className="pt-2 border-t border-slate-700">
          <p className="text-signal-ai text-xs italic">
            AI-generated analysis: Market showing bullish momentum
          </p>
        </div>
      </div>
    ),
  },
};

/**
 * Demonstrates responsive behavior on mobile.
 */
export const MobileResponsive: Story = {
  args: {
    intensity: 'medium',
    className: 'w-[320px]',
    children: (
      <div className="text-center space-y-3">
        <h3 className="text-lg font-semibold text-white">Mobile View</h3>
        <p className="text-slate-400 text-sm">
          Cards adapt to smaller screens while maintaining the aerospace aesthetic
        </p>
      </div>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};
