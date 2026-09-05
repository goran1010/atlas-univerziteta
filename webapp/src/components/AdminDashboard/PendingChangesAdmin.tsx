import { use } from "react";
import { useOutletContext } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { Spinner } from "../../utils/Spinner";
import { PendingChangesAdminRow } from "./PendingChangesAdminRow";

import type { AdminOutletContext } from "./AdminForm";

function PendingChangesAdmin() {
  const { addNotification, t } = use(RootContext);
  const { pendingChanges, setPendingChanges, pendingLoading } =
    useOutletContext<AdminOutletContext>();

  if (pendingLoading) return <Spinner />;

  if (!pendingChanges.length) {
    return (
      <section className="flex flex-col justify-center items-center p-1 w-full">
        <p className="text-(--text-secondary)">{t("admin.noPendingChanges")}</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col justify-center items-center p-1 w-full">
      <ul className="w-full flex flex-col border border-(--border-strong) rounded-md p-2 bg-(--surface-2) gap-1">
        <li className="hidden sm:grid sm:gap-1 text-center w-full p-2 border border-(--border-strong) rounded-md font-bold text-(--text-primary) bg-(--surface-3) sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
          <div>{t("contribution.change")}</div>
          <div>{t("contribution.entityType")}</div>
          <div>{t("contribution.user")}</div>
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
