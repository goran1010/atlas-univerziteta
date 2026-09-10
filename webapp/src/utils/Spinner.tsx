import { use } from "react";
import { RootContext } from "../contextData/RootContext";

function Spinner() {
  const { t } = use(RootContext);

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
        className="w-full h-full flex justify-center items-center"
      >
        <div
          className="border-3 border-(--border-color) border-t-3 border-t-(--accent) rounded-full h-12 aspect-square max-h-[70%] mx-auto"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <span className="sr-only">{t("loading")}</span>
      </div>
    </>
  );
}

export { Spinner };
