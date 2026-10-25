import { use, type ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";
import { ExternalLink } from "../sharedComponents/ExternalLink";

import type { TFunction } from "../../types";

interface DetailRow {
  label: string;
  value: ReactNode;
}

function isUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("http://") || value.startsWith("https://"))
  );
}

function buildEntityRows(
  targetType: string,
  entity: Record<string, unknown>,
  t: TFunction,
): DetailRow[] {
  const rows: DetailRow[] = [];

  function push(label: string, raw: unknown) {
    if (raw === undefined || raw === null || raw === "") return;

    if (isUrl(raw)) {
      rows.push({
        label,
        value: (
          <ExternalLink href={raw} className="break-all">
            {raw}
          </ExternalLink>
        ),
      });
      return;
    }

    if (typeof raw !== "string" && typeof raw !== "number") return;
    rows.push({ label, value: raw });
  }

  push(t("contribution.dataFields.name"), entity.name);

  switch (targetType) {
    case "UNIVERSITY":
      push(t("contribution.dataFields.acronym"), entity.acronym);
      push(t("contribution.dataFields.city"), entity.city);
      if (typeof entity.entity === "string") {
        push(
          t("contribution.dataFields.entity"),
          t(`contribution.entities.${entity.entity}`),
        );
      }
      if (typeof entity.ownership === "string") {
        push(
          t("contribution.dataFields.ownership"),
          t(`universitiesPage.ownership.${entity.ownership}`),
        );
      }
      push(t("universitiesPage.foundedYear"), entity.foundedYear);
      push(t("contribution.dataFields.website"), entity.website);
      push(t("contribution.dataFields.address"), entity.address);
      push(t("contribution.dataFields.phone"), entity.phone);
      push(t("contribution.dataFields.email"), entity.email);
      push(t("admin.facultyCount"), entity.facultyCount);
      break;
    case "FACULTY":
      push(t("contribution.dataFields.city"), entity.city);
      push(t("contribution.dataFields.website"), entity.website);
      push(t("contribution.dataFields.address"), entity.address);
      push(t("contribution.dataFields.phone"), entity.phone);
      push(t("contribution.dataFields.email"), entity.email);
      push(t("admin.studyProgramCount"), entity.studyProgramCount);
      break;
    case "STUDY_PROGRAM":
      if (typeof entity.cycle === "string") {
        push(
          t("contribution.dataFields.cycle"),
          t(`contribution.cycles.${entity.cycle}`),
        );
      }
      push(t("contribution.dataFields.durationYears"), entity.durationYears);
      push(t("contribution.dataFields.ects"), entity.ects);
      push(t("contribution.dataFields.language"), entity.language);
      push(t("admin.trackCount"), entity.trackCount);
      break;
    case "TRACK":
      push(t("contribution.dataFields.ects"), entity.ects);
      push(t("contribution.dataFields.durationYears"), entity.durationYears);
      break;
  }

  return rows;
}

function DataCard({ heading, rows }: { heading: string; rows: DetailRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-(--border-color) bg-(--surface-2) p-2 sm:p-3 w-full">
      <p className="text-xs font-semibold text-(--text-secondary) mb-1">
        {heading}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-(--border-color) last:border-b-0"
              >
                <th
                  scope="row"
                  className="py-1.5 pr-3 text-left font-medium text-(--text-secondary) whitespace-nowrap align-top"
                >
                  {row.label}
                </th>
                <td className="py-1.5 text-(--text-primary) text-right wrap-break-word">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PendingChangeDetailProps {
  targetType: string;
  typeOfChange: string;
  data: Record<string, unknown>;
  currentEntity?: Record<string, unknown> | null;
  comment?: string | null;
}

function PendingChangeDetail({
  targetType,
  typeOfChange,
  data: proposedData,
  currentEntity,
  comment,
}: PendingChangeDetailProps) {
  const { t } = use(RootContext);

  const hasProposedFields = Object.keys(proposedData).length > 0;

  return (
    <div className="flex flex-col gap-2 pt-2 w-full">
      {typeOfChange === "CREATE" && hasProposedFields && (
        <DataCard
          heading={t("admin.proposedData")}
          rows={buildEntityRows(targetType, proposedData, t)}
        />
      )}

      {typeOfChange === "UPDATE" && (
        <>
          {currentEntity ? (
            <DataCard
              heading={t("admin.currentData")}
              rows={buildEntityRows(targetType, currentEntity, t)}
            />
          ) : currentEntity === null ? (
            <p className="text-xs italic text-(--text-secondary)">
              {t("admin.entityDeleted")}
            </p>
          ) : null}
          {hasProposedFields && (
            <DataCard
              heading={t("admin.proposedChanges")}
              rows={buildEntityRows(targetType, proposedData, t)}
            />
          )}
        </>
      )}

      {typeOfChange === "DELETE" && (
        <>
          {currentEntity ? (
            <DataCard
              heading={t("admin.currentData")}
              rows={buildEntityRows(targetType, currentEntity, t)}
            />
          ) : (
            <p className="text-xs italic text-(--text-secondary)">
              {t("admin.entityDeleted")}
            </p>
          )}
        </>
      )}

      {comment && (
        <div className="flex flex-col gap-1 rounded-lg border border-(--border-color) bg-(--surface-2) p-2 sm:p-3 w-full">
          <p className="text-xs font-semibold text-(--text-secondary) mb-1">
            {t("contribution.comment")}
          </p>
          <p className="text-sm text-(--text-primary) whitespace-pre-wrap wrap-break-word">
            {comment}
          </p>
        </div>
      )}
    </div>
  );
}

export { PendingChangeDetail };
