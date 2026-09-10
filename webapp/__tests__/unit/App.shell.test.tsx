import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { routes } from "../../src/routes";
import { RouterProvider } from "react-router";
import userEvent from "@testing-library/user-event";

beforeEach(() => {
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

async function expectNotificationAndLink({
  notificationText,
  linkName,
}: {
  notificationText: RegExp;
  linkName: RegExp;
}) {
  const notification = await screen.findByText(notificationText);
  const link = await screen.findByRole("link", { name: linkName });

  expect(notification).toBeInTheDocument();
  expect(link).toBeInTheDocument();
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
    const mockUserData = new Response(
      JSON.stringify({
        message: "User retrieved successfully.",
        data: {
          role: "USER",
          email: "testuser@example.com",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const requestUrl =
        typeof url === "string"
          ? url
          : url instanceof URL
            ? url.toString()
            : url.url;

      if (requestUrl.endsWith("/health")) {
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

      if (requestUrl.endsWith("/users/me")) {
        return Promise.resolve(mockUserData.clone());
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

    renderRoot();

    await expectNotificationAndLink({
      notificationText: /Successfully logged in./i,
      linkName: /Profile/i,
    });
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
