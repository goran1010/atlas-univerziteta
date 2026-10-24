import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { routes } from "../../../../src/routes";
import { RouterProvider } from "react-router";

const user = userEvent.setup();

function renderErrorPage() {
  // every test here renders an unmatched route on purpose, which makes
  // react-router warn; the spy scopes the mute to exactly that
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => vi.fn());

  const router = createMemoryRouter(routes, {
    initialEntries: ["/non-existent-route"],
  });

  render(<RouterProvider router={router} />);
  return warnSpy;
}

async function getGoHomeLink() {
  return screen.findByRole("link", {
    name: /Go to Home Page/i,
  });
}

describe("ErrorPage component", () => {
  test("renders error message", async () => {
    const warnSpy = renderErrorPage();
    const errorMessage = await screen.findByText(/There is nothing here./i);
    expect(errorMessage).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalled();
  });

  test("renders Go Home link with correct href", async () => {
    renderErrorPage();

    const goHomeLink = await getGoHomeLink();

    expect(goHomeLink).toBeInTheDocument();
    expect(goHomeLink).toHaveAttribute("href", "/");
  });
});

describe("ErrorPage navigation", () => {
  test("navigates to home page when Go Home link is clicked", async () => {
    renderErrorPage();

    const goHomeLink = await getGoHomeLink();
    await user.click(goHomeLink);

    const homePageHeading = await screen.findByRole("heading", {
      name: /Find programs and universities/i,
    });
    expect(homePageHeading).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
