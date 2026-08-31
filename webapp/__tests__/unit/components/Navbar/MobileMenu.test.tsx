import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MobileMenu } from "../../../../src/components/Navbar/MobileMenu";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { UserData } from "../../../../src/types/auth";
import type { SetIsMenuOpen } from "../../../../src/customHooks/useCloseMenu";

beforeEach(() => {
  localStorage.setItem("language", "en");
});

interface WrapperProps {
  userData: UserData | null;
  setIsMenuOpen: SetIsMenuOpen;
}

function Wrapper({ userData, setIsMenuOpen }: WrapperProps) {
  return (
    <RootContextProvider rootValue={{ userData, setUserData: vi.fn() }}>
      <MemoryRouter>
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

  test("renders improve data link for authenticated user", () => {
    render(
      <Wrapper
        userData={{ email: "user@example.com", role: "USER" }}
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
        userData={{ email: "admin@example.com", role: "ADMIN" }}
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
        userData={{ email: "admin@example.com", role: "ADMIN" }}
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
