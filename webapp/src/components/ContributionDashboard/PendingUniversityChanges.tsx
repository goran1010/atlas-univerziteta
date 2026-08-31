import { use, type Dispatch, type SetStateAction } from "react";
import { RootContext } from "../../contextData/RootContext";
import { PendingUniversityChangesRow } from "./PendingUniversityChangesRow";
import { Spinner } from "../../utils/Spinner";

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

  if (loading) return <Spinner />;

  if (!pendingChanges.length) {
    return (
      <p className="text-center text-(--text-muted) py-4">
        {t("contribution.noPendingChanges")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1 px-2 py-1 text-xs font-semibold text-(--text-muted) uppercase tracking-wide border-b border-(--border-color)">
        <span>{t("contribution.change")}</span>
        <span className="text-center">{t("contribution.entityType")}</span>
        <span className="text-end">{t("contribution.actions")}</span>
      </div>

      <ul className="flex flex-col gap-1">
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
