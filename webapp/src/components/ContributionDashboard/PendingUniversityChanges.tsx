import { use, type Dispatch, type SetStateAction } from "react";
import { RootContext } from "../../contextData/RootContext";
import { PendingUniversityChangesRow } from "./PendingUniversityChangesRow";
import { Spinner } from "../sharedComponents/Spinner";

import type { PendingChange } from "../../schemas/pendingChange";

interface PendingUniversityChangesProps {
  pendingChanges: PendingChange[];
  setPendingChanges: Dispatch<SetStateAction<PendingChange[]>>;
  loading: boolean;
}

function PendingUniversityChanges({
  pendingChanges,
  setPendingChanges,
  loading,
}: PendingUniversityChangesProps) {
  const { t } = use(RootContext);

  if (loading) return <Spinner page />;

  if (!pendingChanges.length) {
    return (
      <p className="text-center text-(--text-muted) py-4">
        {t("contribution.noPendingChanges")}
      </p>
    );
  }

  // ARIA table roles on the grid layout: real <table> elements cannot keep
  // the responsive card layout, the roles give screen readers the
  // column-to-value association
  return (
    <div
      role="table"
      aria-label={t("contribution.pendingChanges")}
      className="flex flex-col gap-1 w-full"
    >
      <div
        role="row"
        className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1 px-2 py-1 text-xs font-semibold text-(--text-muted) uppercase tracking-wide border-b border-(--border-color)"
      >
        <span role="columnheader">{t("contribution.change")}</span>
        <span role="columnheader" className="text-center">
          {t("contribution.entityType")}
        </span>
        <span role="columnheader" className="text-end">
          {t("contribution.actions")}
        </span>
      </div>

      <ul role="rowgroup" className="flex flex-col gap-1">
        {pendingChanges.map((change, i) => (
          <PendingUniversityChangesRow
            key={change.id}
            change={change}
            index={i}
            setPendingChanges={setPendingChanges}
          />
        ))}
      </ul>
    </div>
  );
}

export { PendingUniversityChanges };
