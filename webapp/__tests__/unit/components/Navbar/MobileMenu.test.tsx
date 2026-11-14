import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MobileMenu } from "../../../../src/components/Navbar/MobileMenu";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { UserData } from "../../../../src/types";
import type { SetIsMenuOpen } from "../../../../src/customHooks/useCloseMenu";

beforeEach(() => {
  localStorage.setItem("language", "en");
});

interface WrapperProps {
  userData: UserData | null;
  setIsMenuOpen: SetIsMenuOpen;
  initialEntry?: string;
}

function Wrapper({
  userData,
  setIsMenuOpen,
  initialEntry = "/",
}: WrapperProps) {
  return (
    <RootContextProvider rootValue={{ userData, setUserData: vi.fn() }}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <MobileMenu setIsMenuOpen={setIsMenuOpen} userData={userData} />
      </MemoryRouter>
    </RootContextProvider>
  );
}

describe("MobileMenu", () => {
  test("renders guest links without contributor and admin links", () => {
    render(<Wrapper userData={null} setIsMenuOpen={vi.fn()} />);

    expect(screen.getByRole("link", { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /API Docs/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /About/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Log In$/i })).toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: /Improve Data/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Admin$/i }),
    ).not.toBeInTheDocument();
  });

  test("marks Home as the current page on the home page", () => {
    render(<Wrapper userData={null} setIsMenuOpen={vi.fn()} />);

    expect(screen.getByRole("link", { name: /Home/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("does not mark Home as the current page on other pages", () => {
    render(
      <Wrapper userData={null} setIsMenuOpen={vi.fn()} initialEntry="/about" />,
    );

    expect(screen.getByRole("link", { name: /Home/i })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: /About/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("renders improve data link for authenticated user", () => {
    render(
      <Wrapper
        userData={{
          id: "test-id",
          name: "test",
          email: "user@example.com",
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "USER",
        }}
        setIsMenuOpen={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("link", { name: /Improve Data/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Admin$/i }),
    ).not.toBeInTheDocument();
  });

  test("renders admin link for authenticated admin", () => {
    render(
      <Wrapper
        userData={{
          id: "test-id",
          name: "test",
          email: "admin@example.com",
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "ADMIN",
        }}
        setIsMenuOpen={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("link", { name: /Improve Data/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Admin$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Profile/i })).toBeInTheDocument();
  });

  test("closes mobile menu when navigation links are clicked", async () => {
    const setIsMenuOpen = vi.fn();

    render(
      <Wrapper
        userData={{
          id: "test-id",
          name: "test",
          email: "admin@example.com",
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "ADMIN",
        }}
        setIsMenuOpen={setIsMenuOpen}
      />,
    );

    const links = screen.getAllByRole("link");
    for (const link of links) {
      await userEvent.click(link);
    }

    expect(setIsMenuOpen).toHaveBeenCalled();
    expect(setIsMenuOpen).toHaveBeenCalledWith(false);
  });
});
