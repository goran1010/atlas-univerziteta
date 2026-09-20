import type { TFunction } from "../types";

function SkipNavbarLink({ t }: { t: TFunction }) {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-(--accent) focus:text-white focus:font-semibold focus:shadow-lg"
    >
      {t("nav.skipToContent")}
    </a>
  );
}

export { SkipNavbarLink };
