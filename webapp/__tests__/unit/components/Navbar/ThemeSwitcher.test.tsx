import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSwitcher } from "../../../../src/components/Navbar/ThemeSwitcher";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { AddNotification } from "../../../../src/types/notification";
import type { SetMode } from "../../../../src/customHooks/useTheme";

interface WrapperProps {
  addNotification: AddNotification;
  setMode: SetMode;
  theme: string;
}

function Wrapper({ addNotification, setMode, theme }: WrapperProps) {
  return (
    <RootContextProvider
      rootValue={{
        addNotification,
        removeNotification: vi.fn(),
      }}
    >
      <ThemeSwitcher setMode={setMode} theme={theme} />
    </RootContextProvider>
  );
}

describe("ThemeSwitcher", () => {
  test.each([
    {
      currentTheme: "system",
      expectedNextMode: "light",
      expectedMessage: "Switched to light theme",
    },
    {
      currentTheme: "light",
      expectedNextMode: "dark",
      expectedMessage: "Switched to dark theme",
    },
    {
      currentTheme: "dark",
      expectedNextMode: "system",
      expectedMessage: "Switched to system theme",
    },
  ])(
    "cycles from $currentTheme to $expectedNextMode on click",
    async ({ currentTheme, expectedNextMode, expectedMessage }) => {
      const addNotification = vi.fn();
      const setMode = vi.fn();

      render(
        <Wrapper
          addNotification={addNotification}
          setMode={setMode}
          theme={currentTheme}
        />,
      );

      const themeButton = screen.getByRole("button", {
        name: /Toggle theme/i,
      });

      expect(themeButton).toBeInTheDocument();
      await userEvent.click(themeButton);

      expect(setMode).toHaveBeenCalledWith(expectedNextMode);
      expect(addNotification).toHaveBeenCalledWith({
        type: "info",
        message: expectedMessage,
      });
    },
  );
});
