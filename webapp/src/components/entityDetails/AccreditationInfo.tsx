import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { ShieldCheckIcon } from "../sharedComponents/icons";
import { formatDate } from "../../utils/formatDate";

// accreditation dates are calendar days stored as midnight UTC; formatting
// them in the reader's time zone would show the previous day west of UTC
const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

function AccreditationInfo({
  from,
  to,
  authority,
}: {
  from?: string | undefined;
  to?: string | undefined;
  authority?: string | undefined;
}) {
  const { t, language } = use(RootContext);

  if (!from && !to && !authority) return null;

  function date(value: string) {
    return formatDate(value, language, DATE_OPTIONS);
  }

  let period: string | undefined;
  if (from && to) {
    period = `${date(from)} - ${date(to)}`;
  } else if (from) {
    period = `${t("universitiesPage.accreditationSince")} ${date(from)}`;
  } else if (to) {
    period = `${t("universitiesPage.accreditationUntil")} ${date(to)}`;
  }

  return (
    <div className="flex gap-1.5 text-sm text-(--text-secondary)">
      <ShieldCheckIcon className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        {period && (
          <p>
            {t("universitiesPage.accreditation")}: {period}
          </p>
        )}
        {authority && (
          <p className="text-(--text-muted)">
            {t("universitiesPage.accreditingBody")}: {authority}
          </p>
        )}
      </div>
    </div>
  );
}

export { AccreditationInfo };
