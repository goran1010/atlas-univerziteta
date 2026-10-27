import { useState, use, type Dispatch, type SetStateAction } from "react";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { Button } from "../sharedComponents/Button";
import { Dialog } from "../sharedComponents/Dialog";
import { ConfirmDialog } from "../sharedComponents/ConfirmDialog";
import { handleDiscardUniversityChange } from "./utils/handleDiscardUniversityChange";
import { PendingChangeDetail } from "../AdminDashboard/PendingChangeDetail";
import { ParentBreadcrumb } from "../pendingChanges/ParentBreadcrumb";
import { getChangedEntityName } from "../../utils/getChangedEntityName";
import { countNestedNodes } from "../../utils/countNestedNodes";
import { LEVEL_BADGE } from "../../utils/levelColors";
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
  const nestedCount =
    change.typeOfChange === "CREATE" ? countNestedNodes(change.data) : 0;

  return (
    <li
      role="row"
      className={`rounded-md p-2 sm:p-3 ${isEven ? "bg-(--surface-2)" : "bg-(--surface-alt)"}`}
    >
      <ParentBreadcrumb
        crumbs={change.parentContext ?? []}
        current={entityName}
      />
      <div className="grid gap-2 sm:gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div
          role="cell"
          className="flex justify-between sm:justify-start items-center gap-2"
        >
          <span className="sm:hidden text-xs font-semibold text-(--text-muted)">
            {t("contribution.change")}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${BADGE[change.typeOfChange]}`}
          >
            {t(`contribution.changeTypes.${change.typeOfChange}`)}
          </span>
        </div>

        <div
          role="cell"
          className="flex justify-between sm:justify-center items-center gap-2"
        >
          <span className="sm:hidden text-xs font-semibold text-(--text-muted)">
            {t("contribution.entityType")}
          </span>
          <span className="text-xs font-mono text-(--text-secondary)">
            {t(`contribution.entityTypes.${change.targetType}`)}
          </span>
          {nestedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-(--surface-1) border border-(--border-color) text-(--text-secondary)">
              +{nestedCount} {t("contribution.nestedInTree")}
            </span>
          )}
        </div>

        <div
          role="cell"
          className="flex flex-col sm:flex-row justify-end items-center gap-2"
        >
          <div className="flex w-full sm:w-auto gap-2">
            <Button
              variant="secondary"
              className="px-3 py-2 sm:py-1.5 text-xs flex-1 sm:flex-initial"
              onClick={() => {
                setDialogOpen(true);
              }}
            >
              {t("universitiesPage.viewInfo")}
            </Button>
            <Button
              variant="danger"
              className="px-3 py-2 sm:py-1.5 text-xs flex-1 sm:flex-initial"
              loading={loading}
              onClick={() => {
                setConfirmOpen(true);
              }}
            >
              {t("contribution.deleteChange")}
            </Button>
          </div>
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
        title={
          <>
            <span
              className={`px-1.5 py-0.5 rounded text-xs font-semibold ${BADGE[change.typeOfChange]}`}
            >
              {t(`contribution.changeTypes.${change.typeOfChange}`)}
            </span>{" "}
            <span
              className={`px-1.5 py-0.5 rounded text-xs font-semibold ${LEVEL_BADGE[change.targetType]}`}
            >
              {t(`contribution.entityTypes.${change.targetType}`)}
            </span>
          </>
        }
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
          targetType={change.targetType}
          typeOfChange={change.typeOfChange}
          data={change.data}
          currentEntity={change.currentEntity ?? null}
          parentContext={change.parentContext}
          comment={change.comment}
        />
      </Dialog>
    </li>
  );
}

export { PendingUniversityChangesRow };
