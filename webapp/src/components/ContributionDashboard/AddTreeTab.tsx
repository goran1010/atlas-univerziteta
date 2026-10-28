import { useOutletContext } from "react-router";
import { AddTreeEntity } from "./AddTreeEntity";

import type { ContributionOutletContext } from "./types";

function AddTreeTab() {
  const { refetchPendingChanges } =
    useOutletContext<ContributionOutletContext>();
  return <AddTreeEntity refetchPendingChanges={refetchPendingChanges} />;
}

export { AddTreeTab };
