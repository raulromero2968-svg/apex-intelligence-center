import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/app/globals.css';

/**
 * Storybook Preview Configuration
 *
 * Sets up the "Aerospace Dark Mode" theme for all stories.
 */

const preview: Preview = {
  parameters: {
    // =========================================================================
    // ACTIONS
    // =========================================================================
    actions: { argTypesRegex: '^on[A-Z].*' },

    // =========================================================================
    // CONTROLS
    // =========================================================================
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // =========================================================================
    // BACKGROUNDS (Aerospace Dark Mode)
    // =========================================================================
    backgrounds: {
      default: 'aerospace-deep',
      values: [
        { name: 'aerospace-void', value: '#000000' },
        { name: 'aerospace-deep', value: '#030508' },
        { name: 'aerospace-space', value: '#060A10' },
        { name: 'aerospace-carbon', value: '#0A0F16' },
        { name: 'light', value: '#f8fafc' },
      ],
    },

    // =========================================================================
    // VIEWPORT PRESETS
    // =========================================================================
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '812px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
        ultrawide: {
          name: 'Ultrawide',
          styles: { width: '1920px', height: '1080px' },
        },
      },
    },

    // =========================================================================
    // LAYOUT
    // =========================================================================
    layout: 'centered',

    // =========================================================================
    // DOCS
    // =========================================================================
    docs: {
      toc: true,
      canvas: {
        sourceState: 'shown',
      },
    },
  },

  // ===========================================================================
  // GLOBAL DECORATORS
  // ===========================================================================
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '2rem',
          minHeight: '100vh',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        <Story />
      </div>
    ),
  ],

  // ===========================================================================
  // GLOBAL ARGS
  // ===========================================================================
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'dark', title: 'Aerospace Dark', icon: 'moon' },
          { value: 'light', title: 'Light Mode', icon: 'sun' },
        ],
        showName: true,
      },
    },
    reducedMotion: {
      name: 'Reduced Motion',
      description: 'Reduce motion for accessibility',
      defaultValue: false,
      toolbar: {
        icon: 'accessibility',
        items: [
          { value: false, title: 'Default' },
          { value: true, title: 'Reduced Motion' },
        ],
      },
    },
  },

  // ===========================================================================
  // TAGS
  // ===========================================================================
  tags: ['autodocs'],
};

export default preview;
