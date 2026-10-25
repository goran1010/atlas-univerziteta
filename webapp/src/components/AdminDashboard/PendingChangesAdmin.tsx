import { use } from "react";
import { useOutletContext } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { Spinner } from "../sharedComponents/Spinner";
import { PendingChangesAdminRow } from "./PendingChangesAdminRow";
import { getChangedEntityName } from "../../utils/getChangedEntityName";

import type { AdminOutletContext } from "./types";
import type { AdminPendingChange } from "../../schemas/pendingChange";

// changes against the same entity sit together; creates have no target and
// stay individual rows
function groupPendingChanges(changes: AdminPendingChange[]) {
  const groups: AdminPendingChange[][] = [];
  const byTarget = new Map<string, AdminPendingChange[]>();

  for (const change of changes) {
    if (change.typeOfChange === "CREATE") {
      groups.push([change]);
      continue;
    }
    const key = `${change.targetType}:${String(change.targetId)}`;
    const existing = byTarget.get(key);
    if (existing) {
      existing.push(change);
    } else {
      const group = [change];
      byTarget.set(key, group);
      groups.push(group);
    }
  }

  return groups;
}

function PendingChangesAdmin() {
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const { pendingChanges, setPendingChanges, pendingLoading } =
    useOutletContext<AdminOutletContext>();

  if (pendingLoading) return <Spinner page />;

  if (!pendingChanges.length) {
    return (
      <section className="flex flex-col justify-center items-center p-1 w-full">
        <p className="text-(--text-secondary)">{t("admin.noPendingChanges")}</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col justify-center items-center p-1 w-full">
      {/* ARIA table roles on the grid layout: real <table> elements cannot
          keep the responsive card layout, the roles give screen readers the
          column-to-value association */}
      <ul
        role="table"
        aria-label={t("admin.pendingChanges")}
        className="w-full flex flex-col border border-(--border-strong) rounded-md p-2 bg-(--surface-2) gap-1"
      >
        <li
          role="row"
          className="hidden sm:grid sm:gap-1 text-center w-full p-2 border border-(--border-strong) rounded-md font-bold text-(--text-primary) bg-(--surface-3) sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]"
        >
          <div role="columnheader">{t("contribution.change")}</div>
          <div role="columnheader">{t("contribution.entityType")}</div>
          <div role="columnheader">{t("contribution.user")}</div>
          <div role="columnheader" className="sr-only">
            {t("contribution.actions")}
          </div>
        </li>
        {groupPendingChanges(pendingChanges).flatMap((group, groupIndex) => {
          const rows = group.map((data, indexInGroup) => (
            <PendingChangesAdminRow
              key={data.id}
              data={data}
              addNotification={addNotification}
              setPendingChanges={setPendingChanges}
              index={group.length === 1 ? groupIndex : indexInGroup}
            />
          ));

          if (group.length === 1) return rows;

          const name = getChangedEntityName(group[0]);
          return [
            <li
              key={`group-${group[0].targetType}-${String(group[0].targetId)}`}
              role="rowgroup"
              className="flex flex-col gap-1 border-2 border-(--border-strong) rounded-md p-1"
            >
              <div
                role="row"
                className="px-2 pt-1 text-xs font-semibold uppercase tracking-wide text-(--text-muted)"
              >
                <div role="cell">
                  {`${name ?? ""} - ${t(`contribution.entityTypes.${group[0].targetType}`)} (${String(group.length)})`}
                </div>
              </div>
              <ul role="presentation" className="flex flex-col gap-1">
                {rows}
              </ul>
            </li>,
          ];
        })}
      </ul>
    </section>
  );
}

export { PendingChangesAdmin };
