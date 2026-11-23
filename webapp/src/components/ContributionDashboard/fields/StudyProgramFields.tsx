import { use } from "react";
import { RootContext } from "../../../contextData/RootContext";
import { DataField } from "../DataField";
import { Label } from "../../sharedComponents/Label";
import { Select } from "../../sharedComponents/Select";
import { PROGRAM_LANGUAGES } from "../../../schemas/domain";
import type { ContributionFormDraft, DraftFieldValue } from "../types";
import type {
  ProgramLanguage,
  TypeOfChange,
  StudyCycle,
} from "../../../schemas/domain";

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
    value: DraftFieldValue,
  ) => void;
  idPrefix?: string;
}

function StudyProgramFields({
  data,
  typeOfChange,
  setDataField,
  idPrefix = "",
}: StudyProgramFieldsProps) {
  const { t } = use(RootContext);
  const selectedLanguages = data.languages ?? [];

  // a new pick goes last, so an existing order (main language first) stays
  function toggleLanguage(code: ProgramLanguage, checked: boolean) {
    const next = checked
      ? [...selectedLanguages, code]
      : selectedLanguages.filter((selected) => selected !== code);
    setDataField("languages", next.length > 0 ? next : undefined);
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <Label
          htmlFor={`${idPrefix}dataCycle`}
          required={typeOfChange === "CREATE"}
        >
          {t("contribution.dataFields.cycle")}
        </Label>
        <Select
          id={`${idPrefix}dataCycle`}
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
        id={`${idPrefix}dataDuration`}
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
        id={`${idPrefix}dataEcts`}
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
      <fieldset className="flex flex-col gap-1 min-w-0">
        <legend className="block text-sm font-medium mb-1 text-(--text-secondary)">
          {t("contribution.dataFields.languages")}
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
          {PROGRAM_LANGUAGES.map((code) => (
            <label
              key={code}
              className="flex items-center gap-2 text-sm cursor-pointer text-(--text-primary)"
            >
              <input
                type="checkbox"
                name={`${idPrefix}dataLanguages`}
                value={code}
                checked={selectedLanguages.includes(code)}
                onChange={(e) => {
                  toggleLanguage(code, e.target.checked);
                }}
                className="h-4 w-4 cursor-pointer accent-(--accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
              />
              {t(`programLanguages.${code}`)}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

export { StudyProgramFields };
