import { render, screen } from "@testing-library/react";
import { AdminDashboard } from "../../../../src/components/AdminDashboard/AdminDashboard";
import { PendingChangesAdmin } from "../../../../src/components/AdminDashboard/PendingChangesAdmin";
import { AdminRequests } from "../../../../src/components/AdminDashboard/AdminRequests";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { SERVER_STATUS } from "../../../../src/utils/serverStatus";
import { createMemoryRouter, Navigate, RouterProvider } from "react-router";

import type { UserData } from "../../../../src/customHooks/useStatusCheck";
import type { ServerStatus } from "../../../../src/utils/serverStatus";

interface MockChange {
  id: string;
  entityType: string;
  typeOfChange: "CREATE" | "UPDATE" | "DELETE";
  targetId: number | null;
  parentId: number | null;
  data: {
    name: string;
    city?: string;
    entity?: "FBIH" | "RS" | "BD";
    ownership?: "PUBLIC" | "PRIVATE";
  };
  createdAt: string;
  user: { email: string; role: "ADMIN" | "USER" };
  userId: string;
}

const mockChanges: MockChange[] = [
  {
    id: "8687b282-fcc6-4f69-8744-0f8e1585d991",
    entityType: "FACULTY",
    typeOfChange: "UPDATE",
    targetId: 1,
    parentId: null,
    data: { name: "Faculty of Engineering" },
    createdAt: "2026-05-06T07:34:01.967Z",
    user: { email: "johndoe@examplemail.com", role: "USER" },
    userId: "058d1adc-58e4-4f31-8021-64e37e7d0dd0",
  },
];

const createFetchResponse = (data: unknown, ok = true) => ({
  ok,
  json: () => Promise.resolve(data),
});

const fetchMock = vi.fn();

const setupFetchMock = ({
  pendingRequests = mockChanges,
  csrfToken = "csrf-token",
} = {}) => {
  fetchMock.mockReset();
  fetchMock.mockImplementation((url) => {
    const requestUrl = String(url);
    if (requestUrl.includes("/csrf-token")) {
      return Promise.resolve(
        createFetchResponse({ data: csrfToken, message: "Success" }),
      );
    }
    if (requestUrl.includes("/admin-requests")) {
      return Promise.resolve(
        createFetchResponse({
          data: [],
          message: "Admin requests retrieved successfully.",
        }),
      );
    }
    if (requestUrl.includes("/pending-changes")) {
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

function buildRouter(
  initialUser: UserData,
  rootValue: Record<string, unknown> = {},
) {
  return createMemoryRouter(
    [
      {
        path: "/admin-dashboard",
        element: (
          <RootContextProvider
            initialUserData={initialUser}
            rootValue={rootValue}
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
}

function Wrapper({ initialUser = null }: { initialUser?: UserData }) {
  const router = buildRouter(initialUser ?? { email: "", role: "USER" });
  return <RouterProvider router={router} />;
}

function WrapperWithRootValue({
  initialUser = null,
  rootValue = {},
}: {
  initialUser?: UserData;
  rootValue?: { serverStatus?: ServerStatus };
}) {
  const router = buildRouter(
    initialUser ?? { email: "", role: "USER" },
    rootValue,
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

describe("PendingChanges Component", () => {
  test("renders PendingChanges with 1 request", async () => {
    setupFetchMock();
    render(
      <Wrapper initialUser={{ email: "admin@mail.com", role: "ADMIN" }} />,
    );
    const email = await screen.findByText("johndoe@examplemail.com");
    expect(email).toBeInTheDocument();
    const numberOfRequests = screen.getByLabelText(/pending changes count/i);
    expect(numberOfRequests).toHaveTextContent("1");
  });

  test("renders PendingChanges with 2 requests", async () => {
    const mockChangesMore: MockChange[] = [
      ...mockChanges,
      {
        id: "12345678-90ab-cdef-1234-567890abcdef",
        entityType: "UNIVERSITY",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: null,
        data: {
          name: "New University",
          city: "Sarajevo",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
        createdAt: "2026-05-07T10:20:30.000Z",
        user: { email: "janedoe@examplemail.com", role: "USER" },
        userId: "12345678-90ab-cdef-1234-567890abcdef",
      },
    ];
    setupFetchMock({ pendingRequests: mockChangesMore });
    render(
      <Wrapper initialUser={{ email: "admin@mail.com", role: "ADMIN" }} />,
    );
    await screen.findByText("johndoe@examplemail.com");
    expect(screen.getByLabelText(/pending changes count/i)).toHaveTextContent(
      "2",
    );
    expect(screen.getByText("janedoe@examplemail.com")).toBeInTheDocument();
  });

  test("shows no pending requests when fetch throws a network error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    fetchMock.mockImplementation((url) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/csrf-token")) {
        return Promise.resolve(
          createFetchResponse({ data: "someToken", message: "Success" }),
        );
      }
      return Promise.reject(new Error("Network error"));
    });
    render(
      <Wrapper initialUser={{ email: "admin@mail.com", role: "ADMIN" }} />,
    );
    const pendingMessage = await screen.findByText(
      /There are no pending changes at the moment./i,
    );
    expect(pendingMessage).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  test("shows an error notification when loading pending changes fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    fetchMock.mockImplementation((url) => {
      const requestUrl = String(url);

      if (requestUrl.includes("/pending-changes")) {
        return Promise.reject(new Error("Backend rejected pending changes."));
      }

      return Promise.resolve(
        createFetchResponse({ data: "someToken", message: "Success" }),
      );
    });

    render(
      <Wrapper initialUser={{ email: "admin@mail.com", role: "ADMIN" }} />,
    );

    const errorMessage = await screen.findByText(
      /Error fetching pending changes\./i,
    );

    expect(errorMessage).toBeInTheDocument();
    expect(
      screen.getByText(/There are no pending changes at the moment\./i),
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test("shows the no pending changes state when the server is waking up", async () => {
    render(
      <WrapperWithRootValue
        initialUser={{ email: "admin@mail.com", role: "ADMIN" }}
        rootValue={{ serverStatus: SERVER_STATUS.WAKING as ServerStatus }}
      />,
    );

    expect(
      await screen.findByText(/There are no pending changes at the moment\./i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
