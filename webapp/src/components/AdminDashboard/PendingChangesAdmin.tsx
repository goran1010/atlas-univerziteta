import { useFetchList } from "../../customHooks/useFetchList";
import { adminPendingChangesResponseSchema } from "../../schemas/pendingChange";
import { use, useState } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Spinner } from "../../utils/Spinner";
import { PendingChangesAdminRow } from "./PendingChangesAdminRow";
import type { RootContextType } from "../../contextData/RootContext";

const panelClass =
  "py-3 px-1 sm:px-4 w-full bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm";

function PendingChangesAdmin() {
  const [loading, setLoading] = useState(true);

  const { addNotification, t } = use<RootContextType>(RootContext);
  const [pendingChanges, setPendingChanges] = useFetchList({
    path: "/users/admin/pending-changes",
    responseSchema: adminPendingChangesResponseSchema,
    successMessageKey: "messages.pendingChanges.loadSuccess",
    errorMessageKey: "messages.pendingChanges.fetchError",
    logLabel: "fetch pending changes",
    setLoading,
  });

  if (loading) {
    return <Spinner />;
  }

  if (!pendingChanges.length) {
    return (
      <section className="flex flex-col justify-center items-center p-1 w-full">
        <p className="text-(--text-secondary)">{t("admin.noPendingChanges")}</p>
      </section>
    );
  }

  return (
    <section className={panelClass}>
      <h2 className="text-md text-center font-semibold flex items-center gap-1 p-1 flex-1">
        <span
          aria-label={t("admin.pendingChangesCountAria")}
          className="px-2 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
        >
          {pendingChanges.length}
        </span>
        <span className="flex-1">{t("admin.pendingChanges")}</span>
      </h2>

      <section className="flex flex-col justify-center items-center p-1 w-full">
        <ul className="w-full flex flex-col border border-(--border-strong) rounded-md p-2 bg-(--surface-2) gap-1">
          <li className="hidden sm:grid sm:gap-1 text-center w-full p-2 border border-(--border-strong) rounded-md font-bold text-(--text-primary) bg-(--surface-3) sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
            <div>{t("contribution.change")}</div>
            <div>{t("contribution.entityType")}</div>
            <div>{t("contribution.user")}</div>
          </li>
          {pendingChanges.map((data, index) => {
            return (
              <PendingChangesAdminRow
                key={data.id}
                data={data}
                addNotification={addNotification}
                setPendingChanges={setPendingChanges}
                index={index}
              />
            );
          })}
        </ul>
      </section>
    </section>
  );
}

export { PendingChangesAdmin };
