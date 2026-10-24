import { use } from "react";
import { RootContext } from "../../contextData/RootContext";

interface SpinnerProps {
  size?: "sm" | "md";
  // fills the available page area and centers itself - for whole-page
  // loading states (the plain spinner just centers in its parent)
  page?: boolean;
}

function Spinner({ size = "md", page = false }: SpinnerProps) {
  const { t } = use(RootContext);

  const sizeClass = size === "sm" ? "h-4" : "h-12 max-h-[70%]";
  const wrapperClass = page
    ? "flex-1 self-stretch w-full min-h-[40vh] flex justify-center items-center"
    : size === "sm"
      ? "inline-flex items-center"
      : "w-full h-full flex justify-center items-center";

  return (
    <div role="status" aria-label={t("loading")} className={wrapperClass}>
      <div
        className={`animate-spin border-3 border-(--border-color) border-t-3 border-t-(--accent) rounded-full aspect-square ${sizeClass}`}
      />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}

export { Spinner };
