import { act, render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../src/contextData/ThemeProvider";
import { useTheme } from "../../../src/customHooks/useTheme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  vi.restoreAllMocks();
});

function ThemeProbe() {
  const { theme, resolvedTheme } = useTheme();

  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <span data-testid="resolved-theme-value">{resolvedTheme}</span>
    </div>
  );
}

function renderProbe() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

function mockSystemDark(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList);
}

function dispatchStorageEvent(key: string | null, newValue: string | null) {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
  });
}

describe("ThemeProvider", () => {
  describe("resolvedTheme", () => {
    test("resolves system to dark when the OS prefers dark", () => {
      mockSystemDark(true);

      renderProbe();

      expect(screen.getByTestId("theme-value")).toHaveTextContent("system");
      expect(screen.getByTestId("resolved-theme-value")).toHaveTextContent(
        "dark",
      );
      expect(document.documentElement).toHaveClass("dark");
    });

    test("resolves an explicit light theme to light even when the OS prefers dark", () => {
      mockSystemDark(true);
      localStorage.setItem("theme", "light");

      renderProbe();

      expect(screen.getByTestId("resolved-theme-value")).toHaveTextContent(
        "light",
      );
      expect(document.documentElement).not.toHaveClass("dark");
    });
  });

  describe("stored theme guards", () => {
    test("falls back to system and cleans up an invalid stored value", () => {
      localStorage.setItem("theme", "garbage");

      renderProbe();

      expect(screen.getByTestId("theme-value")).toHaveTextContent("system");
      expect(localStorage.getItem("theme")).toBeNull();
    });
  });

  describe("cross-tab sync", () => {
    test("follows a theme change from another tab", () => {
      renderProbe();

      dispatchStorageEvent("theme", "dark");

      expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
      expect(document.documentElement).toHaveClass("dark");
    });

    test("returns to system when another tab clears the theme", () => {
      localStorage.setItem("theme", "dark");

      renderProbe();

      dispatchStorageEvent("theme", null);

      expect(screen.getByTestId("theme-value")).toHaveTextContent("system");
    });

    test("treats an invalid value from another tab as system", () => {
      localStorage.setItem("theme", "dark");

      renderProbe();

      dispatchStorageEvent("theme", "garbage");

      expect(screen.getByTestId("theme-value")).toHaveTextContent("system");
    });

    test("ignores storage events for other keys", () => {
      localStorage.setItem("theme", "dark");

      renderProbe();

      dispatchStorageEvent("language", "sr");

      expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    });

    test("returns to system when another tab clears all storage", () => {
      localStorage.setItem("theme", "dark");

      renderProbe();

      dispatchStorageEvent(null, null);

      expect(screen.getByTestId("theme-value")).toHaveTextContent("system");
    });
  });
});
