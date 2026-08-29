import { use } from "react";
import { RootContext } from "../../contextData/RootContext";

import type { PickedEntity } from "./EntityPicker";
import type { TFunction } from "../../types/i18n";

interface DetailRow {
  label: string;
  value: string | number;
}

function buildRows(entity: PickedEntity, t: TFunction): DetailRow[] {
  const rows: DetailRow[] = [];

  function push(label: string, value: string | number | undefined | null) {
    if (value !== undefined && value !== null && value !== "") {
      rows.push({ label, value });
    }
  }

  push(t("contribution.dataFields.name"), entity.data.name);

  switch (entity.type) {
    case "UNIVERSITY":
      push(t("contribution.dataFields.city"), entity.data.city);
      push(
        t("contribution.dataFields.entity"),
        t(`contribution.entities.${entity.data.entity}`),
      );
      push(
        t("contribution.dataFields.ownership"),
        t(`universitiesPage.ownership.${entity.data.ownership}`),
      );
      push(t("universitiesPage.foundedYear"), entity.data.foundedYear);
      push(t("contribution.dataFields.website"), entity.data.website);
      push(t("contribution.dataFields.address"), entity.data.address);
      push(t("contribution.dataFields.phone"), entity.data.phone);
      push(t("contribution.dataFields.email"), entity.data.email);
      break;
    case "FACULTY":
      push(t("contribution.dataFields.city"), entity.data.city);
      push(t("contribution.dataFields.website"), entity.data.website);
      push(t("contribution.dataFields.address"), entity.data.address);
      push(t("contribution.dataFields.phone"), entity.data.phone);
      push(t("contribution.dataFields.email"), entity.data.email);
      break;
    case "STUDY_PROGRAM":
      push(
        t("contribution.dataFields.cycle"),
        t(`contribution.cycles.${entity.data.cycle}`),
      );
      push(
        t("contribution.dataFields.durationYears"),
        entity.data.durationYears,
      );
      push(t("contribution.dataFields.ects"), entity.data.ects);
      push(t("contribution.dataFields.language"), entity.data.language);
      break;
    case "SUBJECT":
      push(t("contribution.dataFields.semester"), entity.data.semester);
      push(t("contribution.dataFields.ects"), entity.data.ects);
      push(
        t("contribution.dataFields.subjectType"),
        entity.data.type
          ? t(`contribution.subjectTypes.${entity.data.type}`)
          : undefined,
      );
      break;
    case "TRACK":
      push(t("contribution.dataFields.ects"), entity.data.ects);
      push(
        t("contribution.dataFields.durationYears"),
        entity.data.durationYears,
      );
      break;
  }

  return rows;
}

function SelectedEntityDetails({ entity }: { entity: PickedEntity }) {
  const { t } = use(RootContext);
  const rows = buildRows(entity, t);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-(--border-color) bg-(--surface-alt) p-3">
      <p className="text-xs font-semibold text-(--text-secondary)">
        {t("contribution.picker.currentData")}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="font-medium text-(--text-secondary)">{row.label}</dt>
            <dd className="text-(--text-primary) wrap-break-word">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export { SelectedEntityDetails };
