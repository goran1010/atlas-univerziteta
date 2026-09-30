import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../../src/routes";

vi.mock("../../src/utils/authClient", () => ({
  authClient: {
    getSession: vi.fn().mockRejectedValue(new Error("Session check failed")),
  },
}));

describe("App", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = input instanceof Request ? input.url : input.toString();

      if (url.endsWith("/health")) {
        return Promise.resolve(new Response(null, { status: 200 }));
      }

      return Promise.resolve(new Response(null, { status: 200 }));
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  test("shows a login-status error when the session check fails", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/"],
    });
    render(<RouterProvider router={router} />);

    const errorNotification = await screen.findByText(
      "Could not check your login status. Refresh the page and try again.",
    );

    expect(errorNotification).toBeInTheDocument();
  });
});
