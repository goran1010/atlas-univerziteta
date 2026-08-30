import { render, screen } from "@testing-library/react";
import { ContributionDashboard } from "../../../../src/components/ContributionDashboard/ContributionDashboard";
import { AddDataTab } from "../../../../src/components/ContributionDashboard/AddDataTab";
import { PendingChangesTab } from "../../../../src/components/ContributionDashboard/PendingChangesTab";
import { Notifications } from "../../../../src/components/Notifications";
import userEvent from "@testing-library/user-event";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { createMemoryRouter, Navigate, RouterProvider } from "react-router";

import type { UserData } from "../../../../src/types/auth";
import type { PendingChange } from "../../../../src/schemas/pendingChange";
import type { RootContextType } from "../../../../src/contextData/RootContext";

const mockPendingChanges: PendingChange[] = [
  {
    id: "8687b282-fcc6-4f69-8744-0f8e1585d991",
    entityType: "FACULTY",
    typeOfChange: "UPDATE",
    targetId: 1,
    parentId: null,
    data: { name: "Faculty of Engineering" },
    createdAt: new Date(),
    user: { email: "johndoe@examplemail.com", role: "USER" },
    userId: "058d1adc-58e4-4f31-8021-64e37e7d0dd0",
  },
];

const wakingRootValue: Partial<RootContextType> = {
  serverStatus: "waking",
};

function createFetchResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fetchMock = vi.fn();

function setupFetchMock({
  pendingChanges = [],
  pendingData,
  error = null,
}: {
  pendingChanges?: PendingChange[];
  pendingData?: unknown;
  error?: string | null;
} = {}) {
  fetchMock.mockReset();
  fetchMock.mockImplementation((url) => {
    const requestUrl = String(url);

    if (requestUrl.includes("/pending-changes/universities")) {
      if (error) {
        return Promise.resolve(
          createFetchResponse({ error: { message: error } }, 400),
        );
      }

      return Promise.resolve(
        createFetchResponse({
          data: pendingData ?? pendingChanges,
          message: "Pending requests fetched successfully.",
        }),
      );
    }

    throw new Error(`Unexpected fetch request: ${requestUrl}`);
  });
}

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
  setupFetchMock();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const user = userEvent.setup();

function buildRouter(
  initialUser: UserData,
  rootValue: Partial<RootContextType> = {},
) {
  return createMemoryRouter(
    [
      {
        path: "/improve-data",
        element: (
          <RootContextProvider
            initialUserData={initialUser}
            rootValue={rootValue}
          >
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
}

function Wrapper({ initialUser }: { initialUser: UserData }) {
  return <RouterProvider router={buildRouter(initialUser)} />;
}

function WrapperWithRootValue({
  initialUser,
  rootValue = {},
}: {
  initialUser: UserData;
  rootValue?: Partial<RootContextType>;
}) {
  return <RouterProvider router={buildRouter(initialUser, rootValue)} />;
}

describe("ContributionForm component rendering", () => {
  test("renders Add new data tab link", async () => {
    render(<Wrapper initialUser={{ email: "some@email.com", role: "USER" }} />);

    const tab = await screen.findByRole("link", { name: /Add new data/i });
    expect(tab).toBeInTheDocument();
  });

  test("renders Pending changes tab link", async () => {
    render(<Wrapper initialUser={{ email: "some@email.com", role: "USER" }} />);

    const tab = await screen.findByRole("link", { name: /Pending changes/i });
    expect(tab).toBeInTheDocument();
  });

  test("shows entity type select when Add new data tab is active", async () => {
    render(<Wrapper initialUser={{ email: "some@email.com", role: "USER" }} />);

    const entityTypeLabel = await screen.findByText(/Entity Type/i);
    expect(entityTypeLabel).toBeInTheDocument();
  });

  test("switches to pending changes tab on click", async () => {
    render(<Wrapper initialUser={{ email: "some@email.com", role: "USER" }} />);

    const tab = await screen.findByRole("link", { name: /Pending changes/i });
    await user.click(tab);
    const noChanges = await screen.findByText(/no pending changes/i);
    expect(noChanges).toBeInTheDocument();
  });

  test("shows the pending changes count after loading pending changes", async () => {
    setupFetchMock({ pendingChanges: mockPendingChanges });
    render(<Wrapper initialUser={{ email: "some@email.com", role: "USER" }} />);

    const tab = await screen.findByRole("link", { name: /Pending changes/i });
    await user.click(tab);

    // The count badge appears inside the "Pending changes" tab link
    expect(tab).toHaveTextContent("1");
  });

  test("shows an error notification when pending changes fail to load", async () => {
    setupFetchMock({
      error: "Error fetching pending changes.",
    });
    render(<Wrapper initialUser={{ email: "some@email.com", role: "USER" }} />);

    const tab = await screen.findByRole("link", { name: /Pending changes/i });
    await user.click(tab);

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(/Error fetching pending changes\./i);
    expect(screen.getByText(/no pending changes/i)).toBeInTheDocument();
  });

  test("rejects a malformed successful pending changes response", async () => {
    setupFetchMock({ pendingData: [{ id: "invalid-pending-change" }] });
    render(<Wrapper initialUser={{ email: "some@email.com", role: "USER" }} />);

    await user.click(
      await screen.findByRole("link", { name: /Pending changes/i }),
    );

    expect(
      await screen.findByText(/^Error fetching pending changes\.$/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/no pending changes/i)).toBeInTheDocument();
  });

  test("does not fetch pending changes when the server is waking up", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <WrapperWithRootValue
        initialUser={{ email: "some@email.com", role: "USER" }}
        rootValue={wakingRootValue}
      />,
    );

    const tab = await screen.findByRole("link", { name: /Pending changes/i });
    await user.click(tab);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
