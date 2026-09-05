import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="m-auto backdrop:bg-black/50 backdrop:backdrop-blur-sm rounded-2xl border border-(--border-color) bg-(--surface-2) text-(--text-primary) shadow-(--card-shadow) p-0 w-[min(95vw,40rem)] max-h-[85vh] overflow-y-auto"
    >
      <div className="sticky top-0 flex items-center justify-between p-3 border-b border-(--border-color) bg-(--surface-2) z-10">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1 rounded-md cursor-pointer text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--hover-surface) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="p-3">{children}</div>
      {footer && (
        <div className="sticky bottom-0 flex flex-col sm:flex-row sm:justify-end gap-2 p-3 border-t border-(--border-color) bg-(--surface-2)">
          {footer}
        </div>
      )}
    </dialog>
  );
}

export { Dialog };
