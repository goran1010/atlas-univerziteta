import { render, screen } from "@testing-library/react";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { makeUser } from "../../../utils/makeUser";
import { PendingChangesAdminRow } from "../../../../src/components/AdminDashboard/PendingChangesAdminRow";

import type { AdminPendingChange } from "../../../../src/schemas/pendingChange";

const change: AdminPendingChange = {
  id: "8687b282-fcc6-4f69-8744-0f8e1585d991",
  entityType: "TRACK",
  typeOfChange: "DELETE",
  targetId: 1,
  parentId: null,
  data: {},
  userId: "user-1",
  user: makeUser({ email: "johndoe@examplemail.com" }),
  createdAt: new Date(),
  currentEntity: null,
};

describe("PendingChangesAdminRow", () => {
  test("renders the change type, entity label, submitter and actions", () => {
    render(
      <RootContextProvider>
        <PendingChangesAdminRow
          data={change}
          addNotification={vi.fn()}
          setPendingChanges={vi.fn()}
          index={0}
        />
      </RootContextProvider>,
    );

    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Track (smjer)")).toBeInTheDocument();
    expect(screen.getByText("johndoe@examplemail.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Approve/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reject/i })).toBeInTheDocument();
  });
});
