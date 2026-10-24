import { use } from "react";
import { RootContext } from "../../../contextData/RootContext";
import { DataField } from "../DataField";
import { Label } from "../../sharedComponents/Label";
import { Select } from "../../sharedComponents/Select";
import type { ContributionFormDraft } from "../types";
import type { TypeOfChange, StudyCycle } from "../../../schemas/domain";

const CYCLES: StudyCycle[] = [
  "FIRST",
  "SECOND",
  "THIRD",
  "INTEGRATED",
  "VOCATIONAL",
  "SPECIALIST",
];

interface StudyProgramFieldsProps {
  data: ContributionFormDraft;
  typeOfChange: TypeOfChange;
  setDataField: (
    field: keyof ContributionFormDraft,
    value: string | number | undefined,
  ) => void;
}

function StudyProgramFields({
  data,
  typeOfChange,
  setDataField,
}: StudyProgramFieldsProps) {
  const { t } = use(RootContext);

  return (
    <>
      <div className="flex flex-col gap-1">
        <Label htmlFor="dataCycle" required={typeOfChange === "CREATE"}>
          {t("contribution.dataFields.cycle")}
        </Label>
        <Select
          id="dataCycle"
          value={data.cycle ?? ""}
          onChange={(e) => {
            setDataField("cycle", e.target.value);
          }}
          required={typeOfChange === "CREATE"}
        >
          <option value="">-</option>
          {CYCLES.map((c) => (
            <option key={c} value={c}>
              {t(`contribution.cycles.${c}`)}
            </option>
          ))}
        </Select>
      </div>
      <DataField
        label={t("contribution.dataFields.durationYears")}
        id="dataDuration"
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
      <DataField
        label={t("contribution.dataFields.ects")}
        id="dataEcts"
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
        label={t("contribution.dataFields.language")}
        id="dataLanguage"
        type="text"
        value={data.language ?? ""}
        onChange={(e) => {
          setDataField("language", e.target.value || undefined);
        }}
      />
    </>
  );
}

export { StudyProgramFields };
