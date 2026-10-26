import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Navigate, RouterProvider } from "react-router";
import { ContributionDashboard } from "../../../../src/components/ContributionDashboard/ContributionDashboard";
import { AddDataTab } from "../../../../src/components/ContributionDashboard/AddDataTab";
import { PendingChangesTab } from "../../../../src/components/ContributionDashboard/PendingChangesTab";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { makeUser } from "../../../utils/makeUser";
import { server, http, HttpResponse } from "../../../utils/msw";

import type { UserData } from "../../../../src/types";

const user = userEvent.setup();

const pendingChange = {
  id: "8687b282-fcc6-4f69-8744-0f8e1585d991",
  targetType: "FACULTY",
  typeOfChange: "UPDATE",
  targetId: 1,
  parentId: null,
  data: { name: "Faculty of Engineering" },
  createdAt: "2026-05-06T07:34:01.967Z",
  user: makeUser({ email: "johndoe@examplemail.com" }),
  userId: "058d1adc-58e4-4f31-8021-64e37e7d0dd0",
};

function givenPendingChanges(changes: unknown[]) {
  server.use(
    http.get("*/users/contribution/pending-changes/universities", () =>
      HttpResponse.json({
        data: changes,
        message: "Pending changes retrieved successfully.",
      }),
    ),
  );
}

function renderDashboard(initialUser: UserData = makeUser()) {
  const router = createMemoryRouter(
    [
      {
        path: "/improve-data",
        element: (
          <RootContextProvider initialUserData={initialUser}>
            <Notifications />
            <ContributionDashboard />
          </RootContextProvider>
        ),
        children: [
          { index: true, element: <Navigate to="add" replace /> },
          { path: "add", element: <AddDataTab /> },
          { path: "pending", element: <PendingChangesTab /> },
        ],
      },
    ],
    { initialEntries: ["/improve-data"] },
  );
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  givenPendingChanges([]);
});

describe("ContributionDashboard", () => {
  test("shows the registered-user message when not logged in", async () => {
    renderDashboard(null);

    expect(
      await screen.findByText(
        /You need to be a registered user to propose changes to the content./i,
      ),
    ).toBeInTheDocument();
  });

  test("renders the heading, tab links and entity type select for a user", async () => {
    renderDashboard();

    expect(
      await screen.findByRole("heading", { name: /Improve the Data/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Propose changes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /My suggestions/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Item type/i)).toBeInTheDocument();
  });

  test("switches to the pending changes tab on click", async () => {
    renderDashboard();

    await user.click(
      await screen.findByRole("link", { name: /My suggestions/i }),
    );

    expect(
      await screen.findByText(/You have no suggestions awaiting review/i),
    ).toBeInTheDocument();
  });

  test("shows the pending changes count in the tab link", async () => {
    givenPendingChanges([pendingChange]);
    renderDashboard();

    const tab = await screen.findByRole("link", { name: /My suggestions/i });

    // The count badge renders inside the "My suggestions" tab link
    await waitFor(() => {
      expect(tab).toHaveTextContent("1");
    });
  });

  test("shows an error notification when pending changes fail to load", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    server.use(
      http.get("*/users/contribution/pending-changes/universities", () =>
        HttpResponse.json(
          {
            error: {
              message:
                "Something went wrong while loading pending changes. Refresh the page and try again.",
            },
          },
          { status: 400 },
        ),
      ),
    );
    renderDashboard();

    await user.click(
      await screen.findByRole("link", { name: /My suggestions/i }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      /Something went wrong while loading pending changes\. Refresh the page and try again\./i,
    );
    expect(
      screen.getByText(/You have no suggestions awaiting review/i),
    ).toBeInTheDocument();
  });

  test("rejects a malformed successful pending changes response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => vi.fn());
    givenPendingChanges([{ id: "invalid-pending-change" }]);
    renderDashboard();

    await user.click(
      await screen.findByRole("link", { name: /My suggestions/i }),
    );

    expect(
      await screen.findByText(
        /^Something went wrong while loading pending changes\. Refresh the page and try again\.$/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You have no suggestions awaiting review/i),
    ).toBeInTheDocument();
  });
});
