import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}

const ICON_BADGE = {
  danger: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  success:
    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

function DangerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// One confirmation step in front of a destructive action: cancel is a no-op,
// confirm closes the dialog and the caller runs the action.
function ConfirmDialog({
  open,
  title,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = use(RootContext);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            className="px-4 py-1.5 text-sm"
            onClick={onCancel}
          >
            {t("confirm.cancel")}
          </Button>
          <Button
            variant={confirmVariant}
            className="px-4 py-1.5 text-sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 py-2">
        <span
          className={`flex items-center justify-center shrink-0 w-11 h-11 rounded-full ${ICON_BADGE[confirmVariant]}`}
        >
          {confirmVariant === "danger" ? <DangerIcon /> : <SuccessIcon />}
        </span>
        <p className="text-sm text-(--text-secondary) leading-relaxed">
          {t("confirm.message")}
        </p>
      </div>
    </Dialog>
  );
}

export { ConfirmDialog };
