import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import {
  GitHubIcon,
  EnvelopeIcon,
  AlertCircleIcon,
} from "../sharedComponents/icons";
import { ExternalLink } from "../sharedComponents/ExternalLink";

// blank issues are disabled in the repo, so link to the template chooser
const REPORT_ISSUE_URL =
  "https://github.com/goran1010/atlas-univerziteta/issues/new/choose";

function Footer() {
  const { t } = use(RootContext);

  return (
    <footer className="w-full flex justify-between items-center font-bold px-3 py-2 text-(--text-primary) border-t border-(--border-color) backdrop-blur bg-(--surface-2) md:sticky md:bottom-0 md:z-40">
      <address className="not-italic w-full flex flex-col sm:flex-row justify-between items-center gap-1">
        <ExternalLink
          href="https://github.com/goran1010"
          className="flex items-center gap-1.5 text-sm"
        >
          <GitHubIcon />
          {t("footer.name")}
        </ExternalLink>
        <ExternalLink
          href={REPORT_ISSUE_URL}
          className="flex items-center gap-1.5 text-sm"
        >
          <AlertCircleIcon />
          {t("footer.reportIssue")}
        </ExternalLink>
        <ExternalLink
          href={`mailto:${t("footer.email")}`}
          newTab={false}
          className="flex items-center gap-1.5 text-sm"
        >
          <EnvelopeIcon />
          {t("footer.email")}
        </ExternalLink>
      </address>
    </footer>
  );
}

export { Footer };
