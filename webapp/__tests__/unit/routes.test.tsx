import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../../src/routes";

const mockedResponse = new Response(
  JSON.stringify({
    data: [{ id: 1, code: "mocked code" }],
    message: "mocked message",
  }),
  {
    status: 200,
    headers: { "Content-Type": "application/json" },
  },
);

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(mockedResponse);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

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
  test("render Error Page when visiting non-existent address", async () => {
    const consoleSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    renderRoute("/non-existent-address");

    const linkElement = await screen.findByText(/Go to Home Page/i);
    expect(linkElement).not.toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("visit home page renders the universities page", async () => {
    renderRoute("/");

    const heading = await screen.findByRole("heading", {
      name: /Find programs and universities/i,
      level: 1,
    });
    expect(heading).not.toBeNull();
  });

  test.each(["/home"])(
    "redirects %s to the home page",
    async (route) => {
      renderRoute(route);

      const heading = await screen.findByRole("heading", {
        name: /Find programs and universities/i,
        level: 1,
      });
      expect(heading).not.toBeNull();
    },
  );

  test("visit about page", async () => {
    renderRoute("/about");

    const heading = await screen.findByRole("heading", {
      name: /Universities and Study Programs in Bosnia and Herzegovina/i,
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
