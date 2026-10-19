import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AdminForm } from "../../../../src/components/AdminDashboard/AdminForm";
import { AdminRequests } from "../../../../src/components/AdminDashboard/AdminRequests";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { makeUser } from "../../../utils/makeUser";
import { server, http, HttpResponse } from "../../../utils/msw";

import type { AdminRequest } from "../../../../src/schemas/adminRequest";

const user = userEvent.setup();

const mockAdminRequests: AdminRequest[] = [
  {
    id: "058d1adc-58e4-4f31-8021-64e37e7d0dd0",
    email: "johndoe@examplemail.com",
    adminRequestedAt: "2026-08-16T10:00:00.000Z",
  },
];

function givenAdminRequests(adminRequests: AdminRequest[]) {
  server.use(
    http.get("*/users/admin/admin-requests", () =>
      HttpResponse.json({
        data: adminRequests,
        message: "Admin requests retrieved successfully.",
      }),
    ),
    http.get("*/users/admin/pending-changes", () =>
      HttpResponse.json({
        data: [],
        message: "Pending changes retrieved successfully.",
      }),
    ),
  );
}

function renderAdminRequests() {
  const router = createMemoryRouter(
    [
      {
        path: "/admin-dashboard",
        element: (
          <RootContextProvider
            initialUserData={makeUser({
              email: "admin@example.com",
              role: "ADMIN",
            })}
          >
            <Notifications />
            <AdminForm />
          </RootContextProvider>
        ),
        children: [{ path: "admin-requests", element: <AdminRequests /> }],
      },
    ],
    { initialEntries: ["/admin-dashboard/admin-requests"] },
  );
  render(<RouterProvider router={router} />);
}

describe("AdminRequests component", () => {
  test("renders a request row with email", async () => {
    givenAdminRequests(mockAdminRequests);
    renderAdminRequests();

    expect(
      await screen.findByText("johndoe@examplemail.com"),
    ).toBeInTheDocument();
  });

  test("renders the empty state when there are no requests", async () => {
    givenAdminRequests([]);
    renderAdminRequests();

    expect(
      await screen.findByText(/There are no admin requests at the moment./i),
    ).toBeInTheDocument();
  });

  test("approves a request and removes the row", async () => {
    givenAdminRequests(mockAdminRequests);
    let approvedId: string | undefined;
    server.use(
      http.post("*/users/admin/approve-admin-request", async ({ request }) => {
        approvedId = ((await request.json()) as { id: string }).id;
        return HttpResponse.json({
          data: null,
          message: "Admin request approved successfully.",
        });
      }),
    );
    renderAdminRequests();

    await user.click(await screen.findByRole("button", { name: /Approve/i }));

    expect(
      await screen.findByText(/Admin request approved./i),
    ).toBeInTheDocument();
    expect(approvedId).toBe(mockAdminRequests[0]?.id);
    expect(
      screen.queryByText("johndoe@examplemail.com"),
    ).not.toBeInTheDocument();
  });

  test("declines a request and removes the row", async () => {
    givenAdminRequests(mockAdminRequests);
    let declinedId: string | undefined;
    server.use(
      http.delete(
        "*/users/admin/decline-admin-request",
        async ({ request }) => {
          declinedId = ((await request.json()) as { id: string }).id;
          return HttpResponse.json({
            data: null,
            message: "Admin request declined successfully.",
          });
        },
      ),
    );
    renderAdminRequests();

    await user.click(await screen.findByRole("button", { name: /Reject/i }));

    expect(
      await screen.findByText(/Admin request declined./i),
    ).toBeInTheDocument();
    expect(declinedId).toBe(mockAdminRequests[0]?.id);
    expect(
      screen.queryByText("johndoe@examplemail.com"),
    ).not.toBeInTheDocument();
  });

  test("shows an error notification when fetching requests fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    server.use(
      http.get("*/users/admin/admin-requests", () =>
        HttpResponse.json(
          { error: { message: "Something went wrong." } },
          { status: 500 },
        ),
      ),
      http.get("*/users/admin/pending-changes", () =>
        HttpResponse.json({
          data: [],
          message: "Pending changes retrieved successfully.",
        }),
      ),
    );
    renderAdminRequests();

    expect(
      await screen.findByText(/Could not load admin requests./i),
    ).toBeInTheDocument();
  });
});
