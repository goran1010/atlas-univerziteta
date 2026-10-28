import { use, type ReactNode } from "react";
import { mapsHref, telHref } from "../../utils/contactHrefs";
import { RootContext } from "../../contextData/RootContext";
import { ExternalLink } from "../sharedComponents/ExternalLink";
import { ParentBreadcrumb } from "../pendingChanges/ParentBreadcrumb";
import { getChangedEntityName } from "../../utils/getChangedEntityName";
import { LEVEL_GUIDE, LEVEL_TEXT } from "../../utils/levelColors";

import type { EntityLevel } from "../../utils/levelColors";

import type { TFunction } from "../../types";
import type { ParentCrumb } from "../../schemas/pendingChange";
import type {
  FacultyTreeData,
  StudyProgramTreeData,
  TrackCreateData,
  UniversityTreeData,
} from "../../schemas/contribution";

interface FieldSpec {
  key: string;
  label: string;
  translate?: (value: string, t: TFunction) => string;
}

function entityFieldSpecs(targetType: string, t: TFunction): FieldSpec[] {
  const name = { key: "name", label: t("contribution.dataFields.name") };
  const city = { key: "city", label: t("contribution.dataFields.city") };
  const website = {
    key: "website",
    label: t("contribution.dataFields.website"),
  };
  const address = {
    key: "address",
    label: t("contribution.dataFields.address"),
  };
  const phone = { key: "phone", label: t("contribution.dataFields.phone") };
  const email = { key: "email", label: t("contribution.dataFields.email") };
  const ects = { key: "ects", label: t("contribution.dataFields.ects") };
  const durationYears = {
    key: "durationYears",
    label: t("contribution.dataFields.durationYears"),
  };

  switch (targetType) {
    case "UNIVERSITY":
      return [
        name,
        { key: "acronym", label: t("contribution.dataFields.acronym") },
        city,
        {
          key: "entity",
          label: t("contribution.dataFields.entity"),
          translate: (value, translator) =>
            translator(`contribution.entities.${value}`),
        },
        {
          key: "ownership",
          label: t("contribution.dataFields.ownership"),
          translate: (value, translator) =>
            translator(`universitiesPage.ownership.${value}`),
        },
        { key: "foundedYear", label: t("universitiesPage.foundedYear") },
        website,
        address,
        phone,
        email,
        { key: "facultyCount", label: t("admin.facultyCount") },
      ];
    case "FACULTY":
      return [
        name,
        city,
        website,
        address,
        phone,
        email,
        { key: "studyProgramCount", label: t("admin.studyProgramCount") },
      ];
    case "STUDY_PROGRAM":
      return [
        name,
        {
          key: "cycle",
          label: t("contribution.dataFields.cycle"),
          translate: (value, translator) =>
            translator(`contribution.cycles.${value}`),
        },
        durationYears,
        ects,
        { key: "language", label: t("contribution.dataFields.language") },
        { key: "trackCount", label: t("admin.trackCount") },
      ];
    case "TRACK":
      return [name, ects, durationYears];
    default:
      return [name];
  }
}

function isUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("http://") || value.startsWith("https://"))
  );
}

function formatValue(
  raw: unknown,
  spec: FieldSpec,
  t: TFunction,
): ReactNode | null {
  if (raw === undefined || raw === null || raw === "") return null;

  if (typeof raw === "string" && spec.key === "email") {
    return (
      <ExternalLink href={`mailto:${raw}`} newTab={false} className="break-all">
        {raw}
      </ExternalLink>
    );
  }

  if (typeof raw === "string" && spec.key === "address") {
    return (
      <ExternalLink href={mapsHref(raw)} className="break-all">
        {raw}
      </ExternalLink>
    );
  }

  if (typeof raw === "string" && spec.key === "phone") {
    return (
      <ExternalLink href={telHref(raw)} newTab={false}>
        {raw}
      </ExternalLink>
    );
  }

  if (isUrl(raw)) {
    return (
      <ExternalLink href={raw} className="break-all">
        {raw}
      </ExternalLink>
    );
  }

  if (typeof raw === "string" && spec.translate) return spec.translate(raw, t);
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  return raw;
}

interface DetailRow {
  label: string;
  value: ReactNode;
}

function buildEntityRows(
  targetType: string,
  entity: Record<string, unknown>,
  t: TFunction,
): DetailRow[] {
  return entityFieldSpecs(targetType, t)
    .map((spec) => ({
      label: spec.label,
      value: formatValue(entity[spec.key], spec, t),
    }))
    .filter((row) => row.value !== null);
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

function ChildGroup({
  label,
  level,
  children,
}: {
  label: string;
  level: EntityLevel;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 pl-2 sm:pl-3 ${LEVEL_GUIDE[level]}`}>
      <p className={`text-xs font-semibold ${LEVEL_TEXT[level]}`}>{label}</p>
      {children}
    </div>
  );
}

function TrackTreeCards({ tracks }: { tracks: TrackCreateData[] }) {
  const { t } = use(RootContext);

  return (
    <ChildGroup
      level="TRACK"
      label={`${t("admin.trackCount")} (${String(tracks.length)})`}
    >
      {tracks.map((track, index) => (
        <DataCard
          key={`${track.name}-${String(index)}`}
          heading={track.name}
          rows={buildEntityRows("TRACK", track, t)}
        />
      ))}
    </ChildGroup>
  );
}

function StudyProgramTreeCards({
  studyPrograms,
}: {
  studyPrograms: StudyProgramTreeData[];
}) {
  const { t } = use(RootContext);

  return (
    <ChildGroup
      level="STUDY_PROGRAM"
      label={`${t("admin.studyProgramCount")} (${String(studyPrograms.length)})`}
    >
      {studyPrograms.map((program, index) => (
        <div
          key={`${program.name}-${program.cycle}-${String(index)}`}
          className="flex flex-col gap-2"
        >
          <DataCard
            heading={program.name}
            rows={buildEntityRows("STUDY_PROGRAM", program, t)}
          />
          {program.tracks && <TrackTreeCards tracks={program.tracks} />}
        </div>
      ))}
    </ChildGroup>
  );
}

function FacultyTreeCards({ faculties }: { faculties: FacultyTreeData[] }) {
  const { t } = use(RootContext);

  return (
    <ChildGroup
      level="FACULTY"
      label={`${t("admin.facultyCount")} (${String(faculties.length)})`}
    >
      {faculties.map((faculty, index) => (
        <div
          key={`${faculty.name}-${String(index)}`}
          className="flex flex-col gap-2"
        >
          <DataCard
            heading={faculty.name}
            rows={buildEntityRows("FACULTY", faculty, t)}
          />
          {faculty.studyPrograms && (
            <StudyProgramTreeCards studyPrograms={faculty.studyPrograms} />
          )}
        </div>
      ))}
    </ChildGroup>
  );
}

// The nested children of a tree CREATE as indented card groups; also reused
// as the preview for tree submissions. The data has passed the tree create
// schemas upstream (API response or paste validation), so the children
// arrays match the inferred tree types.
function TreeChildCards({
  targetType,
  data,
}: {
  targetType: string;
  data: Record<string, unknown>;
}) {
  if (targetType === "UNIVERSITY") {
    const { faculties } = data as Partial<UniversityTreeData>;
    return faculties ? <FacultyTreeCards faculties={faculties} /> : null;
  }
  if (targetType === "FACULTY") {
    const { studyPrograms } = data as Partial<FacultyTreeData>;
    return studyPrograms ? (
      <StudyProgramTreeCards studyPrograms={studyPrograms} />
    ) : null;
  }
  if (targetType === "STUDY_PROGRAM") {
    const { tracks } = data as Partial<StudyProgramTreeData>;
    return tracks ? <TrackTreeCards tracks={tracks} /> : null;
  }
  return null;
}

// values are strings or numbers by the time they reach the diff; anything
// else never compares equal
function comparable(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return null;
}

type DiffState = "changed" | "cleared" | "same";

interface DiffRow {
  label: string;
  current: ReactNode;
  proposed: ReactNode;
  state: DiffState;
}

function buildDiffRows(
  targetType: string,
  currentEntity: Record<string, unknown>,
  proposedData: Record<string, unknown>,
  t: TFunction,
): DiffRow[] {
  return entityFieldSpecs(targetType, t)
    .filter((spec) => spec.key in proposedData)
    .map((spec) => {
      const currentRaw = currentEntity[spec.key];
      const current = formatValue(currentRaw, spec, t);

      const proposedRaw = proposedData[spec.key];
      if (proposedRaw === null) {
        return {
          label: spec.label,
          current,
          proposed: null,
          state: "cleared" as const,
        };
      }

      const proposed = formatValue(proposedRaw, spec, t);
      const same = comparable(proposedRaw) === comparable(currentRaw);
      return {
        label: spec.label,
        current,
        proposed,
        state: same ? ("same" as const) : ("changed" as const),
      };
    });
}

function DiffProposedCell({ row }: { row: DiffRow }) {
  const { t } = use(RootContext);

  if (row.state === "cleared") {
    return (
      <span className="italic text-red-700 dark:text-red-300">
        {t("admin.diff.cleared")}
      </span>
    );
  }
  if (row.state === "same") {
    return (
      <>
        {row.proposed}
        <span className="ml-1 italic text-xs text-(--text-muted)">
          ({t("admin.diff.noChange")})
        </span>
      </>
    );
  }
  return (
    <span className="font-semibold text-(--text-primary)">{row.proposed}</span>
  );
}

function DiffCard({
  targetType,
  currentEntity,
  proposedData,
}: {
  targetType: string;
  currentEntity: Record<string, unknown>;
  proposedData: Record<string, unknown>;
}) {
  const { t } = use(RootContext);
  const rows = buildDiffRows(targetType, currentEntity, proposedData, t);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-(--border-color) bg-(--surface-2) p-2 sm:p-3 w-full">
      <p className="text-xs font-semibold text-(--text-secondary) mb-1">
        {t("admin.proposedChanges")}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-(--border-strong) text-xs text-(--text-muted) uppercase tracking-wide">
              <th scope="col" className="py-1 pr-3 text-left font-semibold">
                {t("admin.diff.field")}
              </th>
              <th scope="col" className="py-1 pr-3 text-left font-semibold">
                {t("admin.diff.current")}
              </th>
              <th scope="col" className="py-1 text-left font-semibold">
                {t("admin.diff.proposed")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className={`border-b border-(--border-color) last:border-b-0 ${
                  row.state === "changed" || row.state === "cleared"
                    ? "bg-yellow-50 dark:bg-yellow-900/20"
                    : ""
                }`}
              >
                <th
                  scope="row"
                  className="py-1.5 pr-3 text-left font-medium text-(--text-secondary) whitespace-nowrap align-top"
                >
                  {row.label}
                </th>
                <td className="py-1.5 pr-3 text-(--text-secondary) wrap-break-word align-top">
                  {row.current ?? (
                    <span className="text-(--text-muted)">-</span>
                  )}
                </td>
                <td className="py-1.5 text-(--text-primary) wrap-break-word align-top">
                  <DiffProposedCell row={row} />
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
  currentEntity?: Record<string, unknown> | null | undefined;
  parentContext?: ParentCrumb[] | null | undefined;
  comment?: string | null | undefined;
  currentPath?: string | undefined;
}

function PendingChangeDetail({
  targetType,
  typeOfChange,
  data: proposedData,
  currentEntity,
  parentContext,
  comment,
  currentPath,
}: PendingChangeDetailProps) {
  const { t } = use(RootContext);

  const hasProposedFields = Object.keys(proposedData).length > 0;
  const entityName = getChangedEntityName({
    currentEntity,
    data: proposedData,
  });

  return (
    <div className="flex flex-col gap-2 pt-2 w-full">
      <ParentBreadcrumb
        crumbs={parentContext ?? []}
        current={entityName}
        currentPath={currentPath}
      />
      {typeOfChange === "CREATE" && hasProposedFields && (
        <>
          <DataCard
            heading={t("admin.proposedData")}
            rows={buildEntityRows(targetType, proposedData, t)}
          />
          <TreeChildCards targetType={targetType} data={proposedData} />
        </>
      )}

      {typeOfChange === "UPDATE" &&
        (currentEntity ? (
          <DiffCard
            targetType={targetType}
            currentEntity={currentEntity}
            proposedData={proposedData}
          />
        ) : (
          <>
            {currentEntity === null && (
              <p className="text-xs italic text-(--text-secondary)">
                {t("admin.entityDeleted")}
              </p>
            )}
            {hasProposedFields && (
              <DataCard
                heading={t("admin.proposedChanges")}
                rows={buildEntityRows(targetType, proposedData, t)}
              />
            )}
          </>
        ))}

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

export { PendingChangeDetail, TreeChildCards };
