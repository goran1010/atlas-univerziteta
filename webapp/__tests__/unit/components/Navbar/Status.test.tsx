import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Status } from "../../../../src/components/Navbar/Status";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { UserData } from "../../../../src/types/auth";
import type { SetIsMenuOpen } from "../../../../src/customHooks/useCloseMenu";

interface WrapperProps {
  userData: UserData;
  setIsMenuOpen: SetIsMenuOpen;
}

function Wrapper({ userData, setIsMenuOpen }: WrapperProps) {
  return (
    <RootContextProvider rootValue={{ userData, setUserData: vi.fn() }}>
      <MemoryRouter>
        <Status setIsMenuOpen={setIsMenuOpen} />
      </MemoryRouter>
    </RootContextProvider>
  );
}

describe("Status", () => {
  test("renders Profile link for logged user", async () => {
    const setIsMenuOpen = vi.fn();

    render(
      <Wrapper
        userData={{ email: "test@example.com", role: "USER" }}
        setIsMenuOpen={setIsMenuOpen}
      />,
    );

    const profileLink = screen.getByRole("link", { name: /Profile/i });
    expect(profileLink).toBeInTheDocument();

    await userEvent.click(profileLink);
    expect(setIsMenuOpen).toHaveBeenCalledWith(false);
  });

  test("renders Log In link for guest user", async () => {
    const setIsMenuOpen = vi.fn();

    render(<Wrapper userData={null} setIsMenuOpen={setIsMenuOpen} />);

    const loginLink = screen.getByRole("link", { name: /^Log In$/i });
    expect(loginLink).toBeInTheDocument();

    await userEvent.click(loginLink);
    expect(setIsMenuOpen).toHaveBeenCalledWith(false);
  });
});
