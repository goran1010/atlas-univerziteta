import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSwitcher } from "../../../../src/components/Navbar/ThemeSwitcher";
import { ThemeProvider } from "../../../../src/contextData/ThemeProvider";
import { RootContextProvider } from "../../../utils/rootContextProvider";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

function renderSwitcher() {
  const addNotification = vi.fn();
  render(
    <RootContextProvider
      rootValue={{ addNotification, removeNotification: vi.fn() }}
    >
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    </RootContextProvider>,
  );
  return { addNotification, select: screen.getByRole("combobox") };
}

describe("ThemeSwitcher", () => {
  test("lists the themes and shows the current one on its chip", () => {
    localStorage.setItem("theme", "dark");
    const { select } = renderSwitcher();

    expect(select).toHaveAccessibleName("Theme");
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["System", "Light", "Dark"]);
    expect(select).toHaveValue("dark");
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  test.each([
    { choice: "light", expectedStored: "light", isDark: false },
    { choice: "dark", expectedStored: "dark", isDark: true },
  ])(
    "applies and stores $choice without a notification",
    async ({ choice, expectedStored, isDark }) => {
      const { select, addNotification } = renderSwitcher();

      await userEvent.selectOptions(select, choice);

      expect(localStorage.getItem("theme")).toBe(expectedStored);
      expect(document.documentElement.classList.contains("dark")).toBe(isDark);
      expect(select).toHaveValue(choice);
      expect(addNotification).not.toHaveBeenCalled();
    },
  );

  test("going back to system clears the stored theme", async () => {
    localStorage.setItem("theme", "dark");
    const { select } = renderSwitcher();

    await userEvent.selectOptions(select, "system");

    expect(localStorage.getItem("theme")).toBeNull();
  });
});
