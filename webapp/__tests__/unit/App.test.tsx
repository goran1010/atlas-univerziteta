import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../../src/routes";

vi.mock("../../src/utils/authClient", () => ({
  authClient: {
    getSession: vi.fn().mockRejectedValue(new Error("Session check failed")),
  },
}));

describe("App", () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  test("shows a login-status error when the session check fails", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const router = createMemoryRouter(routes, {
      initialEntries: ["/"],
    });
    render(<RouterProvider router={router} />);

    const errorNotification = await screen.findByText(
      "Could not check your login status. Refresh the page and try again.",
    );

    expect(errorNotification).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith(
      "Error checking login status:",
      expect.any(Error),
    );
  });
});
