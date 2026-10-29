import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes, prefetchLazyRoutes } from "../../src/routes";

afterEach(() => {
  vi.restoreAllMocks();
});

function renderRoute(route: string) {
  const router = createMemoryRouter(routes, {
    initialEntries: [route],
  });

  render(<RouterProvider router={router} />);
}

describe("Loading components when visiting an address", () => {
  test("visit home page renders the universities page", async () => {
    renderRoute("/");

    const heading = await screen.findByRole("heading", {
      name: /Find programs and universities/i,
      level: 1,
    });
    expect(heading).not.toBeNull();
  });

  test.each(["/home"])("redirects %s to the home page", async (route) => {
    renderRoute(route);

    const heading = await screen.findByRole("heading", {
      name: /Find programs and universities/i,
      level: 1,
    });
    expect(heading).not.toBeNull();
  });

  test("visit about page", async () => {
    renderRoute("/about");

    const heading = await screen.findByRole("heading", {
      name: /Universities and Study Programs/i,
      level: 1,
    });
    expect(heading).not.toBeNull();
  });

  test.each(["/", "/about"])("render Footer on every page", async (route) => {
    renderRoute(route);

    const footerEmail = await screen.findByText(/goran1010jovic@gmail.com/i);
    const footerAuthor = await screen.findByText(/Goran Jović/i);
    expect(footerEmail).not.toBeNull();
    expect(footerAuthor).not.toBeNull();
  });

  test.each(["/", "/about"])("render Navbar on every page", async (route) => {
    renderRoute(route);

    const nav = await screen.findByRole("navigation");
    const homeLink = within(nav).getByRole("link", { name: /Home/i });
    const aboutLink = within(nav).getByRole("link", { name: /About/i });

    expect(homeLink).not.toBeNull();
    expect(aboutLink).not.toBeNull();
  });
});

describe("prefetchLazyRoutes", () => {
  test("warms the route chunks during idle time when available", () => {
    const requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
      callback({} as IdleDeadline);
      return 0;
    });
    vi.stubGlobal("requestIdleCallback", requestIdleCallback);

    prefetchLazyRoutes();

    expect(requestIdleCallback).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  test("falls back to a timeout when requestIdleCallback is missing", () => {
    expect("requestIdleCallback" in window).toBe(false);
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    prefetchLazyRoutes();
    vi.runAllTimers();

    expect(setTimeoutSpy).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
