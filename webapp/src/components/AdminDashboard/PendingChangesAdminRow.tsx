import { memo, type Dispatch, type SetStateAction } from "react";
import { Button } from "../sharedComponents/Button";
import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import {
  handleApprovePendingChange,
  handleDeclinePendingChange,
} from "./utils/adminActions";
import { PendingChangeDetail } from "./PendingChangeDetail";

import type { Notification } from "../../types/notification";
import type { TypeOfChange } from "../ContributionDashboard/types";
import type { AdminPendingChange } from "../../schemas/pendingChange";

interface PendingChangesAdminRowProps {
  data: AdminPendingChange;
  addNotification: (notification: Notification) => void;
  setPendingChanges: Dispatch<SetStateAction<AdminPendingChange[]>>;
  index: number;
}

const PendingChangesAdminRow = memo(
  ({
    data,
    addNotification,
    setPendingChanges,
    index,
  }: PendingChangesAdminRowProps) => {
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const { t, serverStatus } = use(RootContext);
    const ctx = { addNotification, setLoading, t, serverStatus };

    const getChangeTypeStyles = (type: TypeOfChange) => {
      switch (type.toLowerCase()) {
        case "create":
          return "border-l-4 border-l-green-500 dark:border-l-green-400";
        case "update":
          return "border-l-4 border-l-blue-500 dark:border-l-blue-400";
        case "delete":
          return "border-l-4 border-l-red-500 dark:border-l-red-400";
        default:
          return "";
      }
    };

    const getChangeTypeBadgeStyles = (type: TypeOfChange) => {
      switch (type.toLowerCase()) {
        case "create":
          return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
        case "update":
          return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
        case "delete":
          return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
        default:
          return "bg-(--surface-alt) text-(--text-secondary)";
      }
    };

    const currentEntity =
      data.currentEntity != null &&
      typeof data.currentEntity === "object" &&
      !Array.isArray(data.currentEntity)
        ? data.currentEntity
        : null;

    return (
      <form
        className={`rounded-md transition-colors hover:bg-(--hover-surface) ${getChangeTypeStyles(
          data.typeOfChange,
        )} ${index % 2 === 0 ? "bg-(--surface-2)" : "bg-(--surface-alt)"}`}
      >
        {data.parentContext && (
          <p className="text-xs text-(--text-muted) px-2 py-1 text-center truncate">
            {data.parentContext}
          </p>
        )}
        <div className="grid gap-2 w-full p-1 sm:p-1 sm:gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex justify-between sm:justify-center items-center">
            <span className="sm:hidden font-semibold">
              {t("contribution.change")}
            </span>
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold capitalize ${getChangeTypeBadgeStyles(
                data.typeOfChange,
              )}`}
            >
              {t(`contribution.changeTypes.${data.typeOfChange}`)}
            </span>
          </div>
          <div className="flex justify-between sm:justify-center items-center flex-wrap gap-1">
            <span className="sm:hidden font-semibold">
              {t("contribution.entityType")}
            </span>
            <span className="font-mono font-medium text-(--text-primary) text-xs">
              {t(`contribution.entityTypes.${data.entityType}`)}
            </span>
          </div>
          <div className="flex justify-between sm:justify-center items-center flex-wrap gap-1 min-w-0">
            <span className="sm:hidden font-semibold">
              {t("contribution.user")}
            </span>
            <span className="break-all">{data.user.email}</span>
          </div>
        </div>

        <div className="flex justify-center items-center gap-2 p-1">
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs sm:max-w-30"
            onClick={() => {
              setExpanded((prev) => !prev);
            }}
            type="button"
          >
            {expanded ? "▲" : "▼"}{" "}
            {expanded
              ? t("universitiesPage.hideDetails")
              : t("universitiesPage.viewDetails")}
          </Button>
          <Button
            variant="success"
            className="px-3 py-2 text-sm sm:max-w-25"
            onClick={() => {
              void handleApprovePendingChange(data, setPendingChanges, ctx);
            }}
            type="button"
            loading={loading}
          >
            {t("form.approve")}
          </Button>
          <Button
            variant="danger"
            className="px-3 py-2 text-sm sm:max-w-25"
            onClick={() => {
              void handleDeclinePendingChange(data, setPendingChanges, ctx);
            }}
            type="button"
            loading={loading}
          >
            {t("form.reject")}
          </Button>
        </div>

        {expanded && (
          <PendingChangeDetail
            entityType={data.entityType}
            typeOfChange={data.typeOfChange}
            data={data.data}
            currentEntity={currentEntity}
          />
        )}
      </form>
    );
  },
);

export { PendingChangesAdminRow };
