import { use } from "react";
import { RootContext } from "../contextData/RootContext";
import { GitHubIcon, EnvelopeIcon } from "./sharedComponents/icons";

function Footer() {
  const { t } = use(RootContext);

  return (
    <footer className="w-full flex justify-between items-center font-bold px-3 py-2 text-(--text-primary) border-t border-(--border-color) backdrop-blur">
      <address className="not-italic w-full flex flex-col sm:flex-row justify-between items-center gap-1">
        <a
          href="https://github.com/goran1010"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          <GitHubIcon />
          {t("footer.name")}
        </a>
        <a
          href={`mailto:${t("footer.email")}`}
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          <EnvelopeIcon />
          {t("footer.email")}
        </a>
      </address>
    </footer>
  );
}

export { Footer };
