import { use } from "react";
import { RootContext } from "../../contextData/RootContext";

function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  const { t } = use(RootContext);

  const sizeClass = size === "sm" ? "h-4" : "h-12 max-h-[70%]";

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        role="status"
        aria-label={t("loading")}
        className={
          size === "sm"
            ? "inline-flex items-center"
            : "w-full h-full flex justify-center items-center"
        }
      >
        <div
          className={`border-3 border-(--border-color) border-t-3 border-t-(--accent) rounded-full aspect-square ${sizeClass}`}
          style={{ animation: "spin 1s linear infinite" }}
        />
        <span className="sr-only">{t("loading")}</span>
      </div>
    </>
  );
}

export { Spinner };
