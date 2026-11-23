import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, RouterProvider, createMemoryRouter } from "react-router";
import { App } from "../../../../src/App";
import { Notifications } from "../../../../src/components/Notifications";
import { Navbar } from "../../../../src/components/Navbar/Navbar";
import userEvent from "@testing-library/user-event";
import { useCloseMenu } from "../../../../src/customHooks/useCloseMenu";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { ThemeProvider } from "../../../../src/contextData/ThemeProvider";
import { authClient } from "../../../../src/utils/authClient";

vi.mock("../../../../src/utils/authClient", () => ({
  authClient: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { social: vi.fn().mockReturnValue(new Promise(() => undefined)) },
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
}));

import { makeUser } from "../../../utils/makeUser";

import type { UserData } from "../../../../src/types";

async function openMobileMenu() {
  const menuButton = await screen.findByRole("button", {
    name: /Toggle navigation menu/i,
  });

  await userEvent.click(menuButton);

  await waitFor(() => {
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });

  // the button's aria-controls names the menu element directly
  const controlsId = menuButton.getAttribute("aria-controls");
  if (!controlsId) {
    throw new Error("Menu button does not have aria-controls attribute");
  }
  const mobileMenu = document.getElementById(controlsId);
  if (!mobileMenu) {
    throw new Error(`Mobile menu element #${controlsId} not found`);
  }

  return {
    menuButton,
    mobileMenu,
  };
}

function expectSharedNavbarLinks() {
  expect(screen.getByText(/Home/i)).toBeInTheDocument();
  expect(screen.getByText(/About/i)).toBeInTheDocument();
}

describe("Render Navbar on root route", () => {
  function Wrapper({ initialUser }: { initialUser: UserData }) {
    // a data router: App renders ScrollRestoration, which requires one
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: (
            <>
              <Notifications />
              <App />
            </>
          ),
        },
      ],
      { initialEntries: ["/"] },
    );
    return (
      <RootContextProvider initialUserData={initialUser}>
        <RouterProvider router={router} />
      </RootContextProvider>
    );
  }
  test("user not logged in", async () => {
    render(<Wrapper initialUser={null} />);
    await screen.findByText(/Home/i);

    const profile = screen.queryByRole("link", { name: /profile/i });

    expect(profile).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Log In$/i }),
    ).toBeInTheDocument();
    expectSharedNavbarLinks();
  });

  test("user logged in", async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: {
        user: {
          id: "test-id",
          name: "test",
          email: "test@example.com",
          emailVerified: true,
          role: "USER",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {},
      },
      error: null,
    });

    render(<Wrapper initialUser={makeUser()} />);
    await screen.findByText(/Home/i);

    const profile = await screen.findByRole("link", { name: /profile/i });

    expect(profile).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Log In$/i }),
    ).not.toBeInTheDocument();
    expectSharedNavbarLinks();
  });
});

function NavbarWrapper({
  role = "ADMIN",
  withUser = true,
}: {
  role?: "ADMIN" | "USER";
  withUser?: boolean;
}) {
  const userData = withUser ? makeUser({ role }) : null;

  const closeMenu = useCloseMenu();
  return (
    <RootContextProvider rootValue={{ userData, setUserData: vi.fn() }}>
      <ThemeProvider>
        <MemoryRouter>
          <Navbar closeMenu={closeMenu} />
        </MemoryRouter>
      </ThemeProvider>
    </RootContextProvider>
  );
}

type Role = "ADMIN" | "USER";
const roles: Role[] = ["ADMIN", "USER"];

describe("render Navbar mobile menu", () => {
  test.each(roles)("opens mobile menu for %s role", async (role) => {
    render(<NavbarWrapper role={role} />);

    const { menuButton, mobileMenu } = await openMobileMenu();

    expect(menuButton).toBeInTheDocument();
    expect(mobileMenu).toBeInTheDocument();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });

  test("shows user-only links for user in mobile menu", async () => {
    render(<NavbarWrapper role="USER" />);

    const { mobileMenu } = await openMobileMenu();

    expect(
      within(mobileMenu).getByRole("link", { name: /Improve Data/i }),
    ).toBeInTheDocument();
    expect(
      within(mobileMenu).queryByRole("link", { name: /^Admin$/i }),
    ).not.toBeInTheDocument();
  });

  test("shows admin link for admin in mobile menu", async () => {
    render(<NavbarWrapper role="ADMIN" />);

    const { mobileMenu } = await openMobileMenu();

    expect(
      within(mobileMenu).getByRole("link", { name: /Improve Data/i }),
    ).toBeInTheDocument();
    expect(
      within(mobileMenu).getByRole("link", { name: /^Admin$/i }),
    ).toBeInTheDocument();
  });

  test("hides user-only links when user is not logged in", async () => {
    render(<NavbarWrapper withUser={false} />);

    const { mobileMenu } = await openMobileMenu();

    expect(
      within(mobileMenu).queryByRole("link", { name: /Improve Data/i }),
    ).not.toBeInTheDocument();
    expect(
      within(mobileMenu).queryByRole("link", { name: /^Admin$/i }),
    ).not.toBeInTheDocument();
    expect(
      within(mobileMenu).getByRole("link", { name: /^Log In$/i }),
    ).toBeInTheDocument();
  });
});

describe("Navbar switchers", () => {
  test("theme select applies and stores the chosen theme", async () => {
    render(<NavbarWrapper />);

    const themeSelect = screen.getByRole("combobox", { name: "Theme" });

    await userEvent.selectOptions(themeSelect, "dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await userEvent.selectOptions(themeSelect, "system");
    expect(localStorage.getItem("theme")).toBeNull();
  });

  test("language select translates the navbar and stores the choice", async () => {
    render(<NavbarWrapper />);

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Language" }),
      "sr",
    );

    expect(localStorage.getItem("language")).toBe("sr");
    expect(screen.getByRole("combobox", { name: "Jezik" })).toHaveValue("sr");
    expect(screen.getByRole("combobox", { name: "Tema" })).toBeInTheDocument();
  });
});
