import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { UserData } from "../../../../src/customHooks/useStatusCheck";

const mockChanges = [
  {
    createdAt: "2026-05-06T07:34:01.967Z",
    id: "8687b282-fcc6-4f69-8744-0f8e1585d991",
    entityType: "UNIVERSITY",
    typeOfChange: "UPDATE",
    targetId: 1,
    parentId: null,
    data: { name: "University of Divičani", city: "Divičani" },
    user: { email: "johndoe@examplemail.com", role: "USER" },
    userId: "058d1adc-58e4-4f31-8021-64e37e7d0dd0",
  },
];

type MockChange = (typeof mockChanges)[number];

const createFetchResponse = (data: unknown, ok = true) => ({
  ok,
  json: () => Promise.resolve(data),
});

const fetchMock = vi.fn();

const setupFetchMock = ({
  pendingRequests = [] as MockChange[],
  csrfToken = "csrf-token",
} = {}) => {
  fetchMock.mockImplementation((url) => {
    const requestUrl = String(url);
    if (requestUrl.includes("/csrf-token")) {
      return Promise.resolve(
        createFetchResponse({ data: csrfToken, message: "Success" }),
      );
    }
    if (requestUrl.includes("/users/admin/admin-requests")) {
      return Promise.resolve(
        createFetchResponse({
          data: [],
          message: "Admin requests retrieved successfully.",
        }),
      );
    }
    if (requestUrl.includes("/users/admin/pending-changes")) {
      return Promise.resolve(
        createFetchResponse({
          data: pendingRequests,
          message: "Pending requests fetched successfully.",
        }),
      );
    }

    if (requestUrl.includes("/approve-pending-change")) {
      return Promise.resolve(
        createFetchResponse({
          message: "Pending change approved successfully.",
        }),
      );
    }

    if (requestUrl.includes("/decline-pending-change")) {
      return Promise.resolve(
        createFetchResponse({
          message: "Pending change declined successfully.",
        }),
      );
    }

    throw new Error(`Unexpected fetch request: ${requestUrl}`);
  });
};

import { AdminDashboard } from "../../../../src/components/AdminDashboard/AdminDashboard";
import { PendingChangesAdmin } from "../../../../src/components/AdminDashboard/PendingChangesAdmin";
import { AdminRequests } from "../../../../src/components/AdminDashboard/AdminRequests";
import { Notifications } from "../../../../src/components/Notifications";
import { createMemoryRouter, Navigate, RouterProvider } from "react-router";

function Wrapper({ initialUser = null }: { initialUser?: UserData }) {
  const router = createMemoryRouter(
    [
      {
        path: "/admin-dashboard",
        element: (
          <RootContextProvider
            initialUserData={initialUser}
            rootValue={{ addNotification: vi.fn() }}
          >
            <Notifications />
            <AdminDashboard />
          </RootContextProvider>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="pending-changes" replace />,
          },
          { path: "pending-changes", element: <PendingChangesAdmin /> },
          { path: "admin-requests", element: <AdminRequests /> },
        ],
      },
    ],
    { initialEntries: ["/admin-dashboard"] },
  );
  return <RouterProvider router={router} />;
}

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdminForm component rendering", () => {
  test("renders AdminForm component's heading", async () => {
    setupFetchMock();
    render(
      <Wrapper initialUser={{ email: "admin@mail.com", role: "ADMIN" }} />,
    );

    const heading = await screen.findByRole("heading", {
      name: /Admin Dashboard/i,
    });

    expect(heading).toBeInTheDocument();

    // One fetch for pending changes (the active tab)
    expect(fetchMock).toHaveBeenCalled();
  });

  test("renders pending changes list", async () => {
    setupFetchMock({ pendingRequests: mockChanges });

    render(
      <Wrapper initialUser={{ email: "admin@mail.com", role: "ADMIN" }} />,
    );

    const email = await screen.findByText(/johndoe@examplemail.com/i);

    expect(email).toBeInTheDocument();
  });
});

describe("AdminForm component pending changes interaction", () => {
  test("updates pending changes list when a pending request is approved", async () => {
    setupFetchMock({ pendingRequests: mockChanges });
    render(
      <Wrapper initialUser={{ email: "admin@mail.com", role: "ADMIN" }} />,
    );

    const pendingCount = await screen.findByLabelText(/pending changes count/i);
    expect(pendingCount).toHaveTextContent("1");

    const user = userEvent.setup();

    const confirmButton = await screen.findByRole("button", {
      name: /Approve/i,
    });

    await user.click(confirmButton);

    expect(pendingCount).not.toBeInTheDocument();

    expect(
      screen.getByText(/There are no pending changes at the moment./i),
    ).toBeInTheDocument();
  });

  test("removes pending request from the list when declined", async () => {
    setupFetchMock({ pendingRequests: mockChanges });
    render(
      <Wrapper initialUser={{ email: "admin@mail.com", role: "ADMIN" }} />,
    );
    const pendingCount = await screen.findByLabelText(/pending changes count/i);

    const user = userEvent.setup();

    const rejectButton = await screen.findByRole("button", {
      name: /Reject/i,
    });

    await user.click(rejectButton);

    expect(pendingCount).not.toBeInTheDocument();

    expect(
      screen.getByText(/There are no pending changes at the moment./i),
    ).toBeInTheDocument();
  });
});
