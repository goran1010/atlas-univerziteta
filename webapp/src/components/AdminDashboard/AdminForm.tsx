import { NavLink, Outlet } from "react-router";
import { use, useState } from "react";
import { RootContext } from "../../contextData/RootContext";
import { useFetchList } from "../../customHooks/useFetchList";
import { adminPendingChangesResponseSchema } from "../../schemas/pendingChange";
import { adminRequestsResponseSchema } from "../../schemas/adminRequest";

import type { AdminPendingChange } from "../../schemas/pendingChange";
import type { AdminRequest } from "../../schemas/adminRequest";
import type { Dispatch, SetStateAction } from "react";

export interface AdminOutletContext {
  pendingChanges: AdminPendingChange[];
  setPendingChanges: Dispatch<SetStateAction<AdminPendingChange[]>>;
  pendingLoading: boolean;
  adminRequests: AdminRequest[];
  setAdminRequests: Dispatch<SetStateAction<AdminRequest[]>>;
  requestsLoading: boolean;
}

function AdminForm() {
  const { t } = use(RootContext);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [pendingChanges, setPendingChanges] = useFetchList({
    path: "/users/admin/pending-changes",
    responseSchema: adminPendingChangesResponseSchema,
    successMessageKey: "messages.pendingChanges.loadSuccess",
    errorMessageKey: "messages.pendingChanges.fetchError",
    logLabel: "fetch pending changes",
    setLoading: setPendingLoading,
  });

  const [adminRequests, setAdminRequests] = useFetchList({
    path: "/users/admin/admin-requests",
    responseSchema: adminRequestsResponseSchema,
    errorMessageKey: "messages.adminRequest.fetchError",
    logLabel: "fetch admin requests",
    setLoading: setRequestsLoading,
  });

  const outletContext: AdminOutletContext = {
    pendingChanges,
    setPendingChanges,
    pendingLoading,
    adminRequests,
    setAdminRequests,
    requestsLoading,
  };

  return (
    <div className="relative min-h-full w-full flex flex-1 flex-col items-center py-2 sm:p-3">
      <section className="w-full py-4 px-1 sm:px-4 md:p-6 flex flex-col gap-4 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
        <h1 className="text-center text-2xl font-bold pb-2 border-b-2 border-[color-mix(in_oklab,var(--border-color),transparent_35%)]">
          {t("admin.dashboardTitle")}
        </h1>

        <div className="flex gap-1 justify-center border-b border-(--border-color)">
          <NavLink
            to="/admin-dashboard/pending-changes"
            className={({ isActive }) =>
              `relative px-3 py-2 text-sm font-medium rounded-t-md transition-colors cursor-pointer ${
                isActive
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`
            }
          >
            {t("admin.pendingChanges")}
            {!pendingLoading && pendingChanges.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-bold">
                {pendingChanges.length}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/admin-dashboard/admin-requests"
            className={({ isActive }) =>
              `relative px-3 py-2 text-sm font-medium rounded-t-md transition-colors cursor-pointer ${
                isActive
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`
            }
          >
            {t("admin.adminRequests")}
            {!requestsLoading && adminRequests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-bold">
                {adminRequests.length}
              </span>
            )}
          </NavLink>
        </div>

        <Outlet context={outletContext} />
      </section>
    </div>
  );
}
export { AdminForm };
