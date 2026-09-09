import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../../src/routes";

describe("App", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = input instanceof Request ? input.url : input.toString();

      if (url.endsWith("/health")) {
        return Promise.resolve(new Response(null, { status: 200 }));
      }

      if (url.endsWith("/users/me")) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: "User not authenticated." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  test("shows a login-status error when the current-user response is not OK", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/"],
    });
    render(<RouterProvider router={router} />);

    const errorNotification = await screen.findByText(
      "Could not check your login status. Refresh the page and try again.",
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/users\/me$/),
      expect.objectContaining({ method: "GET" }),
    );
    expect(errorNotification).toBeInTheDocument();
  });
});
