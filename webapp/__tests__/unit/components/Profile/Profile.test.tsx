import { render, screen } from "@testing-library/react";
import { Notifications } from "../../../../src/components/Notifications";
import { MemoryRouter, Routes, Route } from "react-router";
import { Profile } from "../../../../src/components/Profile/Profile";
import { LogIn } from "../../../../src/components/LogIn/LogIn";
import userEvent from "@testing-library/user-event";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { makeUser } from "../../../utils/makeUser";
import { server, http, HttpResponse } from "../../../utils/msw";

import type { UserData } from "../../../../src/types";

import { authClient } from "../../../../src/utils/authClient";

vi.mock("../../../../src/utils/authClient", () => ({
  authClient: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: {
      email: vi.fn(),
      social: vi.fn().mockReturnValue(new Promise(() => undefined)),
    },
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
}));

const user = userEvent.setup();

afterEach(() => {
  vi.restoreAllMocks();
});

function givenAdminRequestEndpoints() {
  server.use(
    http.post("*/users/request-admin", () =>
      HttpResponse.json({
        message: "Admin access requested. An admin will review it.",
        data: { adminRequestedAt: "2026-08-16T10:00:00.000Z" },
      }),
    ),
    http.delete("*/users/request-admin", () =>
      HttpResponse.json({ message: "Admin request cancelled.", data: null }),
    ),
  );
}

function renderProfile(initialUser: UserData = makeUser()) {
  render(
    <RootContextProvider initialUserData={initialUser}>
      <MemoryRouter initialEntries={["/profile"]}>
        <Notifications />
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    </RootContextProvider>,
  );
}

async function clickLogout() {
  const logoutButton = await screen.findByRole("button", {
    name: /Log out/i,
  });

  await user.click(logoutButton);

  return logoutButton;
}

describe("Profile Component", () => {
  test("renders access denied card when user is not logged in", async () => {
    renderProfile(null);

    const message = await screen.findByText(
      /You need to be logged in to view your profile./i,
    );
    expect(message).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Log In/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: /Go to Home Page/i }),
    ).toHaveAttribute("href", "/");
  });

  test.each(["USER", "ADMIN"] as const)(
    "displays the profile heading, email and %s role",
    async (role) => {
      renderProfile(
        makeUser({ email: `${role.toLowerCase()}@example.com`, role }),
      );

      expect(
        await screen.findByRole("heading", { name: /My Profile/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${role.toLowerCase()}@example.com`),
      ).toBeInTheDocument();
      expect(screen.getByText(role)).toBeInTheDocument();
    },
  );
});

describe("Profile Component handle logout", () => {
  test("handles logout correctly", async () => {
    vi.mocked(authClient.signOut).mockResolvedValueOnce({
      error: null,
    });
    renderProfile();

    const logoutButton = await clickLogout();

    expect(
      await screen.findByText(/Successfully logged out/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Home Page/i)).toBeInTheDocument();
    expect(logoutButton).not.toBeInTheDocument();
  });

  test("shows an error and stays on profile when logout returns an error", async () => {
    vi.mocked(authClient.signOut).mockResolvedValueOnce({
      error: { message: "Server error" },
    });
    renderProfile();

    await clickLogout();

    expect(
      await screen.findByText("Logout did not complete. Try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /My Profile/i }),
    ).toBeInTheDocument();
  });

  test("handles logout failure due to unexpected error", async () => {
    vi.mocked(authClient.signOut).mockRejectedValueOnce(
      new Error("Network error"),
    );
    renderProfile();

    await clickLogout();

    expect(
      await screen.findByText(/Something went wrong during logout./i),
    ).toBeInTheDocument();
  });
});

describe("Profile Component admin request", () => {
  test("shows the request button for a USER without an active request", async () => {
    renderProfile();

    expect(
      await screen.findByRole("button", { name: /Request admin access/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Admin request pending/i),
    ).not.toBeInTheDocument();
  });

  test("requests admin access and shows the pending state", async () => {
    givenAdminRequestEndpoints();
    renderProfile();

    await user.click(
      await screen.findByRole("button", { name: /Request admin access/i }),
    );

    expect(
      await screen.findByText(/Admin request pending/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cancel admin request/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Request admin access/i }),
    ).not.toBeInTheDocument();
  });

  test("cancels a pending admin request", async () => {
    givenAdminRequestEndpoints();
    renderProfile(makeUser({ adminRequestedAt: "2026-08-16T10:00:00.000Z" }));

    expect(
      await screen.findByText(/Admin request pending/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Cancel admin request/i }),
    );

    expect(
      await screen.findByRole("button", { name: /Request admin access/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Admin request pending/i),
    ).not.toBeInTheDocument();
  });

  test("shows an error notification when the request fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    server.use(
      http.post("*/users/request-admin", () =>
        HttpResponse.json(
          { error: { message: "Something went wrong." } },
          { status: 500 },
        ),
      ),
    );
    renderProfile();

    await user.click(
      await screen.findByRole("button", { name: /Request admin access/i }),
    );

    expect(
      await screen.findByText(
        /Something went wrong while requesting admin access./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Request admin access/i }),
    ).toBeInTheDocument();
  });

  test("does not show admin request controls for an ADMIN", async () => {
    renderProfile(makeUser({ email: "admin@example.com", role: "ADMIN" }));

    await screen.findByRole("heading", { name: /My Profile/i });

    expect(
      screen.queryByRole("button", { name: /Request admin access/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Admin request pending/i),
    ).not.toBeInTheDocument();
  });
});
