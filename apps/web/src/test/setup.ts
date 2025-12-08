/**
 * Test Setup for Vitest + React Testing Library
 *
 * This file is loaded before each test file.
 * It sets up the testing environment for React component tests.
 *
 * @see vitest.config.ts
 */

import { expect, afterEach, vi } from 'vitest';

// Only apply browser mocks when running in jsdom environment
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  // Dynamic import for testing-library (only needed in jsdom)
  const { cleanup } = await import('@testing-library/react');
  const matchers = await import('@testing-library/jest-dom/matchers');

  // Extend Vitest's expect with jest-dom matchers
  expect.extend(matchers as any);

  // Cleanup after each test to prevent memory leaks
  afterEach(() => {
    cleanup();
  });

  // Mock window.matchMedia for components that use media queries
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver for components that use it (e.g., lazy loading)
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor(
      private callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit
    ) {}

    observe(_target: Element): void {
      // Immediately call callback with a mock entry
      this.callback(
        [
          {
            isIntersecting: true,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRatio: 1,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            target: document.createElement('div'),
            time: Date.now(),
          },
        ],
        this
      );
    }

    unobserve(_target: Element): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
  });

  // Mock ResizeObserver
  class MockResizeObserver implements ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    observe(_target: Element, _options?: ResizeObserverOptions): void {}
    unobserve(_target: Element): void {}
    disconnect(): void {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
  });

  // Mock scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  });

  // Mock scrollIntoView on Element prototype
  Element.prototype.scrollIntoView = vi.fn();
}

// Suppress React 18 console errors about act() (applies to both environments)
const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: An update to')
  ) {
    return;
  }
  originalError.call(console, ...args);
};
