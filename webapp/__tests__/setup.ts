import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const media: MediaQueryList = {
  matches: false,
  media: "(prefers-color-scheme: dark)",
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: () => {
    return true;
  },
};

// Mocking window.matchMedia for tests that rely on it,
// since jsdom doesn't implement it by default.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(() => media),
});

// jsdom doesn't implement scrollTo; stub it to silence the warnings.
window.scrollTo = vi.fn() as typeof window.scrollTo;

afterEach(() => {
  cleanup();
});
