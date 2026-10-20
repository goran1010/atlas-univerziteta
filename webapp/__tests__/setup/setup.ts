import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { server } from "../utils/msw";

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("language", "en");
});

afterAll(() => {
  server.close();
});

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

// jsdom doesn't implement scrollTo or the <dialog> API; stub them. The
// dialog stubs keep the open attribute and close event faithful so role
// queries see modal content the way a browser would.
window.scrollTo = vi.fn() as typeof window.scrollTo;
HTMLDialogElement.prototype.showModal = vi.fn(function (
  this: HTMLDialogElement,
) {
  this.open = true;
});
HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new Event("close"));
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});
