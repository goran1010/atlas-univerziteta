import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSwitcher } from "../../../../src/components/Navbar/ThemeSwitcher";
import { ThemeProvider } from "../../../../src/contextData/ThemeProvider";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { AddNotification } from "../../../../src/types/notification";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

function renderSwitcher(addNotification: AddNotification) {
  return render(
    <RootContextProvider
      rootValue={{
        addNotification,
        removeNotification: vi.fn(),
      }}
    >
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    </RootContextProvider>,
  );
}

describe("ThemeSwitcher", () => {
  test.each([
    {
      storedTheme: null,
      expectedNextTheme: "light",
      expectedStored: "light",
      expectedMessage: "Switched to light theme",
    },
    {
      storedTheme: "light",
      expectedNextTheme: "dark",
      expectedStored: "dark",
      expectedMessage: "Switched to dark theme",
    },
    {
      storedTheme: "dark",
      expectedNextTheme: "system",
      expectedStored: null,
      expectedMessage: "Switched to system theme",
    },
  ])(
    "cycles from $storedTheme to $expectedNextTheme on click",
    async ({ storedTheme, expectedStored, expectedMessage }) => {
      if (storedTheme !== null) localStorage.setItem("theme", storedTheme);
      const addNotification = vi.fn();

      renderSwitcher(addNotification);

      const themeButton = screen.getByRole("button", {
        name: /Toggle theme/i,
      });

      expect(themeButton).toBeInTheDocument();
      await userEvent.click(themeButton);

      expect(localStorage.getItem("theme")).toBe(expectedStored);
      expect(addNotification).toHaveBeenCalledWith({
        type: "info",
        message: expectedMessage,
      });
    },
  );
});
