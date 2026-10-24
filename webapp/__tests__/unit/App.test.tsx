import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../../src/routes";
import { NotificationProvider } from "../../src/contextData/NotificationProvider";

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
    render(
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>,
    );

    const errorNotification = await screen.findByText(
      "Could not check your login status. Refresh the page and try again.",
    );

    expect(errorNotification).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith(
      "Error checking login status:",
      expect.any(Error),
    );
  });

  test("announces a completed OAuth login from the callback marker", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const router = createMemoryRouter(routes, {
      initialEntries: ["/?login=success"],
    });
    render(
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>,
    );

    expect(
      await screen.findByText("Successfully logged in."),
    ).toBeInTheDocument();
    expect(router.state.location.search).not.toContain("login=success");
  });
});
