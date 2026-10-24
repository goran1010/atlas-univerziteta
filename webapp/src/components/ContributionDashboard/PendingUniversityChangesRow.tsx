import { useState, use, type Dispatch, type SetStateAction } from "react";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { Button } from "../sharedComponents/Button";
import { Dialog } from "../sharedComponents/Dialog";
import { ConfirmDialog } from "../sharedComponents/ConfirmDialog";
import { handleDiscardUniversityChange } from "./utils/handleDiscardUniversityChange";
import { PendingChangeDetail } from "../AdminDashboard/PendingChangeDetail";
import { ParentBreadcrumb } from "../sharedComponents/ParentBreadcrumb";
import { getChangedEntityName } from "../../utils/getChangedEntityName";
import type { PendingChange } from "../../schemas/pendingChange";

interface BadgeStyles {
  CREATE: string;
  UPDATE: string;
  DELETE: string;
}

const BADGE: BadgeStyles = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  UPDATE:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

interface PendingUniversityChangesRowProps {
  change: PendingChange;
  index: number;
  setPendingChanges: Dispatch<SetStateAction<PendingChange[]>>;
}

function PendingUniversityChangesRow({
  change,
  index,
  setPendingChanges,
}: PendingUniversityChangesRowProps) {
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const [loading, setLoading] = useState(false);
  const ctx = { addNotification, setLoading, t };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    await handleDiscardUniversityChange(change.id, setPendingChanges, ctx);
    setDialogOpen(false);
  }

  const isEven = index % 2 === 0;
  const entityName = getChangedEntityName(change);

  return (
    <li
      className={`rounded-md p-2 sm:p-3 ${isEven ? "bg-(--surface-2)" : "bg-(--surface-alt)"}`}
    >
      <ParentBreadcrumb
        crumbs={change.parentContext ?? []}
        current={entityName}
      />
      <div className="grid gap-2 sm:gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex justify-between sm:justify-start items-center gap-2">
          <span className="sm:hidden text-xs font-semibold text-(--text-muted)">
            {t("contribution.change")}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${BADGE[change.typeOfChange]}`}
          >
            {t(`contribution.changeTypes.${change.typeOfChange}`)}
          </span>
        </div>

        <div className="flex justify-between sm:justify-center items-center gap-2">
          <span className="sm:hidden text-xs font-semibold text-(--text-muted)">
            {t("contribution.entityType")}
          </span>
          <span className="text-xs font-mono text-(--text-secondary)">
            {t(`contribution.entityTypes.${change.entityType}`)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            {t("universitiesPage.viewInfo")}
          </Button>
          <Button
            variant="danger"
            className="px-3 py-1.5 text-xs"
            loading={loading}
            onClick={() => {
              setConfirmOpen(true);
            }}
          >
            {t("contribution.deleteChange")}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t("contribution.deleteChange")}
        confirmLabel={t("contribution.deleteChange")}
        onConfirm={() => {
          setConfirmOpen(false);
          void handleDelete();
        }}
        onCancel={() => {
          setConfirmOpen(false);
        }}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
        title={`${t(`contribution.changeTypes.${change.typeOfChange}`)} ${t(`contribution.entityTypes.${change.entityType}`)}`}
        footer={
          <Button
            variant="danger"
            className="sm:w-auto"
            loading={loading}
            onClick={() => {
              setConfirmOpen(true);
            }}
          >
            {t("contribution.deleteChange")}
          </Button>
        }
      >
        <PendingChangeDetail
          entityType={change.entityType}
          typeOfChange={change.typeOfChange}
          data={change.data}
          currentEntity={change.currentEntity ?? null}
        />
      </Dialog>
    </li>
  );
}

export { PendingUniversityChangesRow };
