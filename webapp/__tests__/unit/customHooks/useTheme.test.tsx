import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <span data-testid="resolved-theme-value">{resolvedTheme}</span>
      <button
        type="button"
        onClick={() => {
          setTheme("dark");
        }}
      >
        Set Dark
      </button>
      <button
        type="button"
        onClick={() => {
          setTheme("light");
        }}
      >
        Set Light
      </button>
      <button
        type="button"
        onClick={() => {
          setTheme("system");
        }}
      >
        Set System
      </button>
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

describe("useTheme", () => {
  test("loads dark theme from localStorage and applies dark class", () => {
    localStorage.setItem("theme", "dark");

    renderProbe();

    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved-theme-value")).toHaveTextContent(
      "dark",
    );
    expect(document.documentElement).toHaveClass("dark");
  });

  test("sets light mode and writes to localStorage", async () => {
    renderProbe();

    const lightButton = screen.getByRole("button", { name: /Set Light/i });

    expect(lightButton).toBeInTheDocument();
    await userEvent.click(lightButton);

    expect(screen.getByTestId("theme-value")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved-theme-value")).toHaveTextContent(
      "light",
    );
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  test("sets system mode and clears localStorage", async () => {
    renderProbe();

    const systemButton = screen.getByRole("button", { name: /Set System/i });

    expect(systemButton).toBeInTheDocument();
    await userEvent.click(systemButton);

    expect(localStorage.getItem("theme")).toBeNull();
    expect(screen.getByTestId("theme-value")).toHaveTextContent("system");
  });

  test("removes the system theme media-query listener on unmount", () => {
    let changeListener: ((event: Event) => void) | undefined;
    const addEventListener = vi.fn(
      (event: string, listener: EventListenerOrEventListenerObject | null) => {
        if (event === "change" && typeof listener === "function") {
          changeListener = listener;
        }
      },
    );
    const removeEventListener = vi.fn();
    const media = {
      matches: false,
      addEventListener,
      removeEventListener,
    };
    vi.spyOn(window, "matchMedia").mockReturnValue(
      media as unknown as MediaQueryList,
    );

    const { unmount } = renderProbe();

    expect(addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    media.matches = true;
    act(() => {
      changeListener?.(new Event("change"));
    });

    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByTestId("resolved-theme-value")).toHaveTextContent(
      "dark",
    );

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
});
