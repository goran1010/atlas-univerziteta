import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Navigate, RouterProvider } from "react-router";
import { AdminDashboard } from "../../../../src/components/AdminDashboard/AdminDashboard";
import { PendingChangesAdmin } from "../../../../src/components/AdminDashboard/PendingChangesAdmin";
import { AdminRequests } from "../../../../src/components/AdminDashboard/AdminRequests";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { makeUser } from "../../../utils/makeUser";
import { server, http, HttpResponse } from "../../../utils/msw";

const contributor = makeUser({ email: "johndoe@examplemail.com" });

const facultyChange = {
  id: "8687b282-fcc6-4f69-8744-0f8e1585d991",
  targetType: "FACULTY",
  typeOfChange: "UPDATE",
  targetId: 1,
  parentId: null,
  data: { name: "Faculty of Engineering" },
  createdAt: "2026-05-06T07:34:01.967Z",
  user: contributor,
  userId: "058d1adc-58e4-4f31-8021-64e37e7d0dd0",
};

const universityChange = {
  id: "12345678-90ab-cdef-1234-567890abcdef",
  targetType: "UNIVERSITY",
  typeOfChange: "CREATE",
  targetId: null,
  parentId: null,
  data: {
    name: "New University",
    city: "Sarajevo",
    country: "BIH",
    entity: "FBIH",
    ownership: "PUBLIC",
  },
  createdAt: "2026-05-07T10:20:30.000Z",
  user: makeUser({ email: "janedoe@examplemail.com" }),
  userId: "12345678-90ab-cdef-1234-567890abcdef",
};

function givenPendingChanges(changes: unknown[]) {
  server.use(
    http.get("*/users/admin/pending-changes", () =>
      HttpResponse.json({
        data: changes,
        message: "Pending changes retrieved successfully.",
      }),
    ),
    http.get("*/users/admin/admin-requests", () =>
      HttpResponse.json({
        data: [],
        message: "Admin requests retrieved successfully.",
      }),
    ),
    http.post("*/users/admin/approve-pending-change", () =>
      HttpResponse.json({
        data: null,
        message: "Pending change approved successfully.",
      }),
    ),
    http.delete("*/users/admin/decline-pending-change", () =>
      HttpResponse.json({
        data: null,
        message: "Pending change declined successfully.",
      }),
    ),
  );
}

function renderAdminDashboard() {
  const router = createMemoryRouter(
    [
      {
        path: "/admin-dashboard",
        element: (
          <RootContextProvider
            initialUserData={makeUser({
              email: "admin@mail.com",
              role: "ADMIN",
            })}
          >
            <Notifications />
            <AdminDashboard />
          </RootContextProvider>
        ),
        children: [
          { index: true, element: <Navigate to="pending-changes" replace /> },
          { path: "pending-changes", element: <PendingChangesAdmin /> },
          { path: "admin-requests", element: <AdminRequests /> },
        ],
      },
    ],
    { initialEntries: ["/admin-dashboard"] },
  );
  render(<RouterProvider router={router} />);
  return userEvent.setup();
}

describe("PendingChangesAdmin", () => {
  test("renders the dashboard heading and a pending change", async () => {
    givenPendingChanges([facultyChange]);
    renderAdminDashboard();

    expect(
      await screen.findByRole("heading", { name: /Admin Dashboard/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("johndoe@examplemail.com"),
    ).toBeInTheDocument();
  });

  test("renders every pending change in the list", async () => {
    givenPendingChanges([facultyChange, universityChange]);
    renderAdminDashboard();

    await screen.findByText("johndoe@examplemail.com");
    expect(screen.getByText("janedoe@examplemail.com")).toBeInTheDocument();
  });

  test("approving a change removes it and shows the empty state", async () => {
    givenPendingChanges([facultyChange]);
    const user = renderAdminDashboard();

    await user.click(await screen.findByRole("button", { name: /Approve/i }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /Approve/i,
      }),
    );

    expect(
      await screen.findByText(/There are no pending changes at the moment./i),
    ).toBeInTheDocument();
  });

  test("declining a change removes it and shows the empty state", async () => {
    givenPendingChanges([facultyChange]);
    const user = renderAdminDashboard();

    await user.click(await screen.findByRole("button", { name: /Reject/i }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /Reject/i,
      }),
    );

    expect(
      await screen.findByText(/There are no pending changes at the moment./i),
    ).toBeInTheDocument();
  });

  test("shows an error notification and the empty state when loading fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    server.use(
      http.get("*/users/admin/pending-changes", () => HttpResponse.error()),
    );
    renderAdminDashboard();

    expect(
      await screen.findByText(
        /Something went wrong while loading pending changes\. Refresh the page and try again\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/There are no pending changes at the moment\./i),
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
