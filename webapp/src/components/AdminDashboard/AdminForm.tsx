import { NavLink, Outlet } from "react-router";
import { use } from "react";
import { RootContext } from "../../contextData/RootContext";

const TABS = [
  { key: "pendingChanges", to: "/admin-dashboard/pending-changes" },
  { key: "adminRequests", to: "/admin-dashboard/admin-requests" },
];

function AdminForm() {
  const { t } = use(RootContext);

  return (
    <div className="relative min-h-full w-full flex flex-1 flex-col items-center py-2 sm:p-3">
      <section className="w-full py-4 px-1 sm:px-4 md:p-6 flex flex-col gap-4 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
        <h1 className="text-center text-2xl font-bold pb-2 border-b-2 border-[color-mix(in_oklab,var(--border-color),transparent_35%)]">
          {t("admin.dashboardTitle")}
        </h1>

        <div className="flex gap-1 justify-center border-b border-(--border-color)">
          {TABS.map((tab) => (
            <NavLink
              key={tab.key}
              to={tab.to}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-t-md transition-colors cursor-pointer ${
                  isActive
                    ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "text-(--text-secondary) hover:text-(--text-primary)"
                }`
              }
            >
              {t(`admin.${tab.key}`)}
            </NavLink>
          ))}
        </div>

        <Outlet />
      </section>
    </div>
  );
}
export { AdminForm };
