import { useState, use } from "react";
import { NavLink, Outlet } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { useGetPendingChanges } from "./customHooks/useGetPendingChanges";

import type { ContributionOutletContext } from "./types";

const TABS = [
  { key: "addNewData", to: "/improve-data/add" },
  { key: "pendingChanges", to: "/improve-data/pending" },
];

function ContributionForm() {
  const { t } = use(RootContext);
  const [loading, setLoading] = useState(false);
  const { pendingChanges, setPendingChanges } = useGetPendingChanges(
    setLoading,
    t,
  );

  const outletContext: ContributionOutletContext = {
    pendingChanges,
    setPendingChanges,
    loading,
  };

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <h1 className="text-center text-(--text-secondary)">
        {t("contribution.title")}
      </h1>
      <div className="flex gap-1 border-b border-(--border-color) items-center justify-center">
        {TABS.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.to}
            className={({ isActive }) =>
              `relative px-3 py-2 text-sm font-medium rounded-t-md transition-colors cursor-pointer ${
                isActive
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`
            }
          >
            {t(`contribution.${tab.key}`)}
            {tab.key === "pendingChanges" &&
              !loading &&
              pendingChanges.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-bold">
                  {pendingChanges.length}
                </span>
              )}
          </NavLink>
        ))}
      </div>

      <Outlet context={outletContext} />
    </div>
  );
}

export { ContributionForm };
