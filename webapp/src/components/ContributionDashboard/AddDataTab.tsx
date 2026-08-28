import { useOutletContext } from "react-router";
import { AddUniversityEntity } from "./AddUniversityEntity";

import type { ContributionOutletContext } from "./types";

function AddDataTab() {
  const { setPendingChanges } = useOutletContext<ContributionOutletContext>();
  return <AddUniversityEntity setPendingChanges={setPendingChanges} />;
}

export { AddDataTab };
