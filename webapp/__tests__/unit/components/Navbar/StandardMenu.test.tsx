import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { StandardMenu } from "../../../../src/components/Navbar/StandardMenu";
import { RootContextProvider } from "../../../utils/rootContextProvider";

beforeEach(() => {
  localStorage.setItem("language", "en");
});

function Wrapper({ initialEntry = "/" }: { initialEntry?: string }) {
  return (
    <RootContextProvider rootValue={{ userData: null, setUserData: vi.fn() }}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <StandardMenu setIsMenuOpen={vi.fn()} userData={null} />
      </MemoryRouter>
    </RootContextProvider>
  );
}

describe("StandardMenu", () => {
  test("marks Home as the current page on the home page", () => {
    render(<Wrapper />);

    expect(screen.getByRole("link", { name: /Home/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("does not mark Home as the current page on other pages", () => {
    render(<Wrapper initialEntry="/about" />);

    expect(screen.getByRole("link", { name: /Home/i })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: /About/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
