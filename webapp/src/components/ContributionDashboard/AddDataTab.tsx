import { useOutletContext } from "react-router";
import { AddUniversityEntity } from "./AddUniversityEntity";

import type { ContributionOutletContext } from "./types";

function AddDataTab() {
  const { refetchPendingChanges } =
    useOutletContext<ContributionOutletContext>();
  return <AddUniversityEntity refetchPendingChanges={refetchPendingChanges} />;
}

export { AddDataTab };
