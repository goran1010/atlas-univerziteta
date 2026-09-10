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

// jsdom doesn't implement scrollTo or the <dialog> API; stub them.
window.scrollTo = vi.fn() as typeof window.scrollTo;
HTMLDialogElement.prototype.showModal = vi.fn();
HTMLDialogElement.prototype.close = vi.fn();

afterEach(() => {
  cleanup();
});
