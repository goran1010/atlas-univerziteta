import { memo, type Dispatch, type SetStateAction } from "react";
import { Button } from "../sharedComponents/Button";
import { Dialog } from "../sharedComponents/Dialog";
import { ConfirmDialog } from "../sharedComponents/ConfirmDialog";
import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import {
  handleApprovePendingChange,
  handleDeclinePendingChange,
} from "./utils/adminActions";
import { PendingChangeDetail } from "./PendingChangeDetail";
import { ParentBreadcrumb } from "../pendingChanges/ParentBreadcrumb";
import { getChangedEntityName } from "../../utils/getChangedEntityName";
import type { Notification } from "../../types";
import type { TypeOfChange } from "../../schemas/domain";
import type { AdminPendingChange } from "../../schemas/pendingChange";

const ROW_ACCENT: Record<TypeOfChange, string> = {
  CREATE: "border-l-4 border-l-green-500 dark:border-l-green-400",
  UPDATE: "border-l-4 border-l-yellow-500 dark:border-l-yellow-400",
  DELETE: "border-l-4 border-l-red-500 dark:border-l-red-400",
};

const BADGE: Record<TypeOfChange, string> = {
  CREATE:
    "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  UPDATE:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
  DELETE: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
};

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
    const [activeAction, setActiveAction] = useState<
      "approve" | "decline" | null
    >(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<
      "approve" | "decline" | null
    >(null);
    const { t } = use(RootContext);
    const loading = activeAction !== null;

    function setLoading(value: boolean) {
      if (!value) setActiveAction(null);
    }

    const ctx = { addNotification, setLoading, t };

    const currentEntity = data.currentEntity ?? null;
    const entityName = getChangedEntityName(data);

    async function handleApprove() {
      setActiveAction("approve");
      await handleApprovePendingChange(data, setPendingChanges, ctx);
      setDialogOpen(false);
    }

    async function handleDecline() {
      setActiveAction("decline");
      await handleDeclinePendingChange(data, setPendingChanges, ctx);
      setDialogOpen(false);
    }

    return (
      <li
        role="row"
        className={`rounded-md transition-colors hover:bg-(--hover-surface) ${
          ROW_ACCENT[data.typeOfChange]
        } ${index % 2 === 0 ? "bg-(--surface-2)" : "bg-(--surface-alt)"}`}
      >
        <ParentBreadcrumb
          crumbs={data.parentContext ?? []}
          current={entityName}
        />
        <div className="grid gap-2 w-full p-1 sm:p-1 sm:gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
          <div
            role="cell"
            className="flex justify-between sm:justify-center items-center"
          >
            <span className="sm:hidden font-semibold">
              {t("contribution.change")}
            </span>
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold capitalize ${
                BADGE[data.typeOfChange]
              }`}
            >
              {t(`contribution.changeTypes.${data.typeOfChange}`)}
            </span>
          </div>
          <div
            role="cell"
            className="flex justify-between sm:justify-center items-center flex-wrap gap-1"
          >
            <span className="sm:hidden font-semibold">
              {t("contribution.entityType")}
            </span>
            <span className="font-mono font-medium text-(--text-primary) text-xs">
              {t(`contribution.entityTypes.${data.targetType}`)}
            </span>
          </div>
          <div
            role="cell"
            className="flex justify-between sm:justify-center items-center flex-wrap gap-1 min-w-0"
          >
            <span className="sm:hidden font-semibold">
              {t("contribution.user")}
            </span>
            <span className="break-all">{data.user.email}</span>
          </div>
        </div>

        <div
          role="cell"
          className="flex flex-col sm:flex-row justify-center items-center gap-2 p-1"
        >
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs sm:max-w-30"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            {t("universitiesPage.viewInfo")}
          </Button>
          <Button
            variant="success"
            className="px-3 py-1.5 text-xs sm:max-w-25"
            onClick={() => {
              setConfirmAction("approve");
            }}
            type="button"
            loading={activeAction === "approve"}
            disabled={loading}
          >
            {t("form.approve")}
          </Button>
          <Button
            variant="danger"
            className="px-3 py-1.5 text-xs sm:max-w-25"
            onClick={() => {
              setConfirmAction("decline");
            }}
            type="button"
            loading={activeAction === "decline"}
            disabled={loading}
          >
            {t("form.reject")}
          </Button>
        </div>

        <ConfirmDialog
          open={confirmAction !== null}
          title={
            confirmAction === "approve" ? t("form.approve") : t("form.reject")
          }
          confirmLabel={
            confirmAction === "approve" ? t("form.approve") : t("form.reject")
          }
          confirmVariant={confirmAction === "approve" ? "success" : "danger"}
          onConfirm={() => {
            const action = confirmAction;
            setConfirmAction(null);
            if (action === "approve") void handleApprove();
            if (action === "decline") void handleDecline();
          }}
          onCancel={() => {
            setConfirmAction(null);
          }}
        />

        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
          }}
          title={`${t(`contribution.changeTypes.${data.typeOfChange}`)} ${t(`contribution.entityTypes.${data.targetType}`)} - ${data.user.email}`}
          footer={
            <>
              <Button
                variant="success"
                className="sm:w-auto"
                onClick={() => {
                  setConfirmAction("approve");
                }}
                type="button"
                loading={activeAction === "approve"}
                disabled={loading}
              >
                {t("form.approve")}
              </Button>
              <Button
                variant="danger"
                className="sm:w-auto"
                onClick={() => {
                  setConfirmAction("decline");
                }}
                type="button"
                loading={activeAction === "decline"}
                disabled={loading}
              >
                {t("form.reject")}
              </Button>
            </>
          }
        >
          <PendingChangeDetail
            targetType={data.targetType}
            typeOfChange={data.typeOfChange}
            data={data.data}
            currentEntity={currentEntity}
          />
        </Dialog>
      </li>
    );
  },
);

export { PendingChangesAdminRow };
