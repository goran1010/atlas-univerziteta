import { useOutletContext } from "react-router";
import { PendingUniversityChanges } from "./PendingUniversityChanges";

import type { ContributionOutletContext } from "./types";

function PendingChangesTab() {
  const { pendingChanges, setPendingChanges, loading } =
    useOutletContext<ContributionOutletContext>();
  return (
    <PendingUniversityChanges
      loading={loading}
      pendingChanges={pendingChanges}
      setPendingChanges={setPendingChanges}
    />
  );
}

export { PendingChangesTab };
