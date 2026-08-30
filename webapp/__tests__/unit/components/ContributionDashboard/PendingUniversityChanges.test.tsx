import { render, screen } from "@testing-library/react";
import { PendingUniversityChanges } from "../../../../src/components/ContributionDashboard/PendingUniversityChanges";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { PendingChange } from "../../../../src/components/ContributionDashboard/types";

const PendingUniversityChangesRowMock = vi.fn();

vi.mock(
  "../../../../src/components/ContributionDashboard/PendingUniversityChangesRow",
  () => ({
    PendingUniversityChangesRow: (props: { change: PendingChange }) => {
      PendingUniversityChangesRowMock(props);
      return (
        <li>
          {"name" in props.change.data ? props.change.data.name : "Mock row"}
        </li>
      );
    },
  }),
);

vi.mock("../../../../src/utils/Spinner", () => ({
  Spinner: () => <p>Loading...</p>,
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <RootContextProvider>{children}</RootContextProvider>;
}

const pendingChanges: PendingChange[] = [
  {
    id: "1",
    entityType: "UNIVERSITY",
    typeOfChange: "CREATE",
    data: {
      name: "University of Sarajevo",
      city: "Sarajevo",
      entity: "FBIH",
      ownership: "PUBLIC",
    },
    targetId: null,
    parentId: null,
    userId: "user-123",
    createdAt: new Date(),
    user: {
      role: "ADMIN",
      email: "user-123@example.com",
    },
  },
  {
    id: "2",
    entityType: "FACULTY",
    typeOfChange: "UPDATE",
    data: { name: "Faculty of Engineering" },
    targetId: 2,
    parentId: null,
    userId: "user-456",
    createdAt: new Date(),
    user: {
      role: "ADMIN",
      email: "user-456@example.com",
    },
  },
];

beforeEach(() => {
  localStorage.setItem("language", "en");
  PendingUniversityChangesRowMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PendingUniversityChanges", () => {
  test("renders spinner when loading", () => {
    render(
      <Wrapper>
        <PendingUniversityChanges
          loading={true}
          pendingChanges={[]}
          setPendingChanges={vi.fn()}
        />
      </Wrapper>,
    );

    expect(screen.getByText(/Loading\.\.\./i)).toBeInTheDocument();
  });

  test("renders no pending changes message", () => {
    render(
      <Wrapper>
        <PendingUniversityChanges
          loading={false}
          pendingChanges={[]}
          setPendingChanges={vi.fn()}
        />
      </Wrapper>,
    );

    expect(
      screen.getByText(/No pending changes to display\./i),
    ).toBeInTheDocument();
  });

  test("renders pending changes rows and count", () => {
    const setPendingChanges = vi.fn();

    render(
      <Wrapper>
        <PendingUniversityChanges
          loading={false}
          pendingChanges={pendingChanges}
          setPendingChanges={setPendingChanges}
        />
      </Wrapper>,
    );

    expect(screen.getByText(/^Change$/)).toBeInTheDocument();
    expect(screen.getByText(/^Entity Type$/)).toBeInTheDocument();

    expect(PendingUniversityChangesRowMock).toHaveBeenCalledTimes(2);
    expect(PendingUniversityChangesRowMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        index: 0,
        setPendingChanges,
      }),
    );
  });
});
