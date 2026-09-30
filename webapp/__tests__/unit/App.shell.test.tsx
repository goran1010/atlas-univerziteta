import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { routes } from "../../src/routes";
import { RouterProvider } from "react-router";
import userEvent from "@testing-library/user-event";
import { authClient } from "../../src/utils/authClient";

vi.mock("../../src/utils/authClient", () => ({
  authClient: {
    getSession: vi.fn(),
    signIn: { social: vi.fn().mockReturnValue(new Promise(() => undefined)) },
    signOut: vi.fn(),
  },
}));

beforeEach(() => {
  vi.mocked(authClient.getSession).mockResolvedValue({
    data: null,
    error: null,
  });
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  vi.spyOn(console, "error").mockImplementation(() => vi.fn());

  fetchSpy.mockImplementation((url) => {
    if (typeof url !== "string") {
      return Promise.reject(new Error("Invalid URL"));
    }
    if (url.endsWith("/health")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            message: "Server is live.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    }

    return Promise.resolve(
      new Response(
        JSON.stringify({
          message: "User not authenticated.",
          data: null,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const user = userEvent.setup();

function renderRoot() {
  const router = createMemoryRouter(routes, {
    initialEntries: ["/"],
  });

  render(<RouterProvider router={router} />);
}

describe("Root component", () => {
  test("renders home page heading if server is live", async () => {
    renderRoot();
    const homeHeading = await screen.findByRole("heading", {
      name: /Find programs and universities/i,
    });
    expect(homeHeading).toBeInTheDocument();
  });

  test("renders Profile link when user is logged in", async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: {
        user: {
          id: "test-id",
          name: "test",
          email: "testuser@example.com",
          emailVerified: true,
          role: "USER",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {},
      },
      error: null,
    });

    renderRoot();

    const profileLink = await screen.findByRole("link", { name: /Profile/i });
    expect(profileLink).toBeInTheDocument();
  });

  test("renders Log In link when user is not logged in", async () => {
    renderRoot();

    const screenLink = await screen.findAllByRole("link", { name: /Log In/i });
    expect(screenLink.length).toBe(1);
  });
});

describe("Root component - Menu interaction", () => {
  test("closes menu when main content is clicked", async () => {
    renderRoot();

    const menuButton = await screen.findByRole("button", {
      name: /Toggle navigation menu/i,
    });
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    const mainContent = await screen.findByRole("main");
    await user.click(mainContent);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });
});
