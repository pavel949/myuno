import "@testing-library/jest-dom";
import { transferableAbortController } from 'node:util';

// React Router builds Node Request objects. jsdom's AbortSignal belongs to a
// different realm and Node rejects it; keep the Request/AbortSignal pair native.
const nativeController = transferableAbortController();
Object.defineProperty(globalThis, 'AbortController', { configurable: true, writable: true, value: nativeController.constructor });
Object.defineProperty(globalThis, 'AbortSignal', { configurable: true, writable: true, value: nativeController.signal.constructor });

// Mock matchMedia for components using media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver for components using it
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver for lazy loading components
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  readonly scrollMargin: string = "";
  
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Suppress console errors in tests (optional, uncomment if needed)
// const originalError = console.error;
// console.error = (...args: any[]) => {
//   if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
//   originalError(...args);
// };
