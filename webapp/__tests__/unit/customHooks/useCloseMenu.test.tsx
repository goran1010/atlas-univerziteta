import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCloseMenu } from "../../../src/customHooks/useCloseMenu";

function CloseMenuProbe() {
  const { isMenuOpen, setIsMenuOpen } = useCloseMenu();

  return (
    <div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsMenuOpen(true);
        }}
      >
        Open Menu
      </button>
      <output data-testid="menu-open">{String(isMenuOpen)}</output>
    </div>
  );
}

describe("useCloseMenu", () => {
  test("closes the menu when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<CloseMenuProbe />);

    await user.click(screen.getByRole("button", { name: "Open Menu" }));
    expect(screen.getByTestId("menu-open")).toHaveTextContent("true");

    await user.keyboard("{Escape}");
    expect(screen.getByTestId("menu-open")).toHaveTextContent("false");
  });

  test("closes the menu on a click elsewhere", async () => {
    const user = userEvent.setup();
    render(<CloseMenuProbe />);

    await user.click(screen.getByRole("button", { name: "Open Menu" }));
    await user.click(screen.getByTestId("menu-open"));

    expect(screen.getByTestId("menu-open")).toHaveTextContent("false");
  });
});
