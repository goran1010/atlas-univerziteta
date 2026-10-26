import { use } from "react";
import { useOutletContext } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { Spinner } from "../sharedComponents/Spinner";
import { PendingChangesAdminRow } from "./PendingChangesAdminRow";

import type { AdminOutletContext } from "./types";

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
          <div role="columnheader">{t("contribution.contributor")}</div>
          <div role="columnheader" className="sr-only">
            {t("contribution.actions")}
          </div>
        </li>
        {pendingChanges.map((data, index) => (
          <PendingChangesAdminRow
            key={data.id}
            data={data}
            addNotification={addNotification}
            setPendingChanges={setPendingChanges}
            index={index}
          />
        ))}
      </ul>
    </section>
  );
}

export { PendingChangesAdmin };
