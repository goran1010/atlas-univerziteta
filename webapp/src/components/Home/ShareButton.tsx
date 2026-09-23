import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { SITE_URL } from "../../utils/envConfig";

function ShareButton({ url }: { url: string }) {
  // context-sourced so no call site can forget the copy notification
  const { t, addNotification } = use(RootContext);

  async function handleShare() {
    const fullUrl = `${SITE_URL}${url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      addNotification({
        type: "success",
        message: t("universitiesPage.linkCopied"),
      });
    } catch {
      addNotification({
        type: "error",
        message: t("universitiesPage.linkCopyFailed"),
      });
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleShare();
      }}
      title={t("universitiesPage.shareLink")}
      aria-label={t("universitiesPage.shareLink")}
      className="inline-flex items-center justify-center p-2 rounded-full text-(--text-muted) hover:text-(--text-primary) hover:bg-(--hover-surface) transition-colors cursor-pointer"
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
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );
}

export { ShareButton };
