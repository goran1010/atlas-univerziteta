import { use } from "react";
import { RootContext } from "../../../contextData/RootContext";
import { DataField } from "../DataField";
import type { ContributionFormDraft } from "../types";

interface TrackFieldsProps {
  data: ContributionFormDraft;
  setDataField: (
    field: keyof ContributionFormDraft,
    value: string | number | undefined,
  ) => void;
  idPrefix?: string;
}

function TrackFields({ data, setDataField, idPrefix = "" }: TrackFieldsProps) {
  const { t } = use(RootContext);

  return (
    <>
      <DataField
        label={t("contribution.dataFields.ects")}
        id={`${idPrefix}dataTrackEcts`}
        type="number"
        min={1}
        value={data.ects ?? ""}
        onChange={(e) => {
          setDataField(
            "ects",
            e.target.value === "" ? undefined : Number(e.target.value),
          );
        }}
      />
      <DataField
        label={t("contribution.dataFields.durationYears")}
        id={`${idPrefix}dataTrackDuration`}
        type="number"
        min={1}
        max={10}
        value={data.durationYears ?? ""}
        onChange={(e) => {
          setDataField(
            "durationYears",
            e.target.value === "" ? undefined : Number(e.target.value),
          );
        }}
      />
    </>
  );
}

export { TrackFields };
