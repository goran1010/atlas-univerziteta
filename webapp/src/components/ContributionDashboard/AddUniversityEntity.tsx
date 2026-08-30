import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Input } from "../sharedComponents/Input";
import { Select } from "../sharedComponents/Select";
import { Label } from "../sharedComponents/Label";
import { Button } from "../sharedComponents/Button";
import { EntityPicker } from "./EntityPicker";
import { getPickerDepth } from "./utils/getPickerDepth";
import { handleSubmitUniversityEntity } from "./utils/handleSubmitUniversityEntity";

import type {
  ContributionFormDraft,
  ContributionFormState,
  Cycle,
  Entity,
  EntityType,
  TypeOfChange,
  PendingChange,
} from "./types";
import type { Dispatch, SetStateAction, SubmitEvent } from "react";

interface DataFieldProps {
  label: string;
  id: string;
  type: string;
  min?: number;
  max?: number;
  required?: boolean;
  value: string | number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
}

const INIT_FORM: ContributionFormState = {
  entityType: "UNIVERSITY",
  typeOfChange: "CREATE",
  parentId: "",
  targetId: "",
  data: {},
};

const ENTITY_TYPES: EntityType[] = [
  "UNIVERSITY",
  "FACULTY",
  "STUDY_PROGRAM",
  "TRACK",
];

const TYPE_OF_CHANGES: TypeOfChange[] = ["CREATE", "UPDATE", "DELETE"];

const CYCLES: Cycle[] = [
  "FIRST",
  "SECOND",
  "THIRD",
  "INTEGRATED",
  "VOCATIONAL",
  "SPECIALIST",
];

const ENTITIES: Entity[] = ["FBIH", "RS", "BD"];

function DataField(props: DataFieldProps) {
  const { label, id } = props;
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input {...props} />
    </div>
  );
}

function AddUniversityEntity({
  setPendingChanges,
}: {
  setPendingChanges: Dispatch<SetStateAction<PendingChange[]>>;
}) {
  const { t, addNotification, serverStatus } = use(RootContext);
  const [formState, setFormState] = useState(INIT_FORM);
  const [loading, setLoading] = useState(false);
  const [pickerResetKey, setPickerResetKey] = useState(0);

  const { entityType, typeOfChange, parentId, targetId, data } = formState;

  function setField(field: keyof ContributionFormState, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  function setSelector(field: "entityType" | "typeOfChange", value: string) {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      parentId: "",
      targetId: "",
    }));
  }

  function setDataField(
    field: keyof ContributionFormDraft,
    value: string | number | undefined,
  ) {
    setFormState((prev) => ({
      ...prev,
      data:
        value === undefined
          ? Object.fromEntries(
              Object.entries(prev.data).filter(([key]) => key !== field),
            )
          : { ...prev.data, [field]: value },
    }));
  }

  const needsParent = typeOfChange === "CREATE" && entityType !== "UNIVERSITY";
  const needsTarget = typeOfChange !== "CREATE" && entityType;
  const needsDataFields = typeOfChange !== "DELETE";

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    await handleSubmitUniversityEntity({
      entityType,
      parentId,
      targetId,
      typeOfChange,
      data,
      setPendingChanges,
      setFormState: () => {
        setFormState(INIT_FORM);
        setPickerResetKey((prev) => prev + 1);
      },
      ctx: { addNotification, setLoading, t, serverStatus },
    });
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-4 w-full max-w-lg"
    >
      <div className="flex flex-col gap-1 items-center">
        <Label htmlFor="entityType">{t("contribution.entityType")}</Label>
        <Select
          id="entityType"
          name="entityType"
          value={entityType}
          onChange={(e) => {
            setSelector("entityType", e.target.value);
          }}
          required
        >
          {ENTITY_TYPES.map((et) => (
            <option key={et} value={et}>
              {t(`contribution.entityTypes.${et}`)}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1 items-center">
        <Label htmlFor="typeOfChange">{t("contribution.change")}</Label>
        <Select
          id="typeOfChange"
          name="typeOfChange"
          value={typeOfChange}
          onChange={(e) => {
            setSelector("typeOfChange", e.target.value);
          }}
          required
        >
          {TYPE_OF_CHANGES.map((c) => (
            <option key={c} value={c}>
              {t(`contribution.changeTypes.${c}`)}
            </option>
          ))}
        </Select>
      </div>
      {(needsParent || needsTarget) && (
        <EntityPicker
          key={`${entityType}-${typeOfChange}-${String(pickerResetKey)}`}
          depth={getPickerDepth(entityType, typeOfChange)}
          legend={
            needsParent
              ? t("contribution.picker.parent")
              : t("contribution.picker.target")
          }
          showSelectedDetails={typeOfChange !== "CREATE"}
          onSelect={(id) => {
            setField(needsParent ? "parentId" : "targetId", id);
          }}
        />
      )}
      {needsDataFields && (
        <fieldset className="flex flex-col gap-3 border border-(--border-color) rounded-lg p-3">
          <legend className="text-xs font-semibold px-1 text-(--text-secondary)">
            Data
          </legend>

          <DataField
            label={t("contribution.dataFields.name")}
            id="dataName"
            type="text"
            required={typeOfChange === "CREATE"}
            value={data.name ?? ""}
            onChange={(e) => {
              setDataField("name", e.target.value);
            }}
          />

          {entityType === "UNIVERSITY" && (
            <>
              <DataField
                label={t("contribution.dataFields.acronym")}
                id="dataAcronym"
                type="text"
                value={data.acronym ?? ""}
                onChange={(e) => {
                  setDataField("acronym", e.target.value || undefined);
                }}
              />
              <DataField
                label={t("contribution.dataFields.city")}
                id="dataCity"
                type="text"
                required={typeOfChange === "CREATE"}
                value={data.city ?? ""}
                onChange={(e) => {
                  setDataField("city", e.target.value);
                }}
              />
              <div className="flex flex-col gap-1 self-center">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="dataEntity" className="text-center">
                    {t("contribution.dataFields.entity")}
                  </Label>
                  <Select
                    id="dataEntity"
                    value={data.entity ?? ""}
                    onChange={(e) => {
                      setDataField("entity", e.target.value);
                    }}
                    required={typeOfChange === "CREATE"}
                  >
                    <option value="">-</option>
                    {ENTITIES.map((en) => (
                      <option key={en} value={en}>
                        {t(`contribution.entities.${en}`)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="dataOwnership" className="text-center">
                    {t("contribution.dataFields.ownership")}
                  </Label>
                  <Select
                    id="dataOwnership"
                    value={data.ownership ?? ""}
                    onChange={(e) => {
                      setDataField("ownership", e.target.value);
                    }}
                    required={typeOfChange === "CREATE"}
                  >
                    <option value="">-</option>
                    <option value="PUBLIC">
                      {t("universitiesPage.ownership.PUBLIC")}
                    </option>
                    <option value="PRIVATE">
                      {t("universitiesPage.ownership.PRIVATE")}
                    </option>
                  </Select>
                </div>
              </div>
              <DataField
                label={t("contribution.dataFields.foundedYear")}
                id="dataFoundedYear"
                type="text"
                value={data.foundedYear ?? ""}
                onChange={(e) => {
                  setDataField("foundedYear", e.target.value || undefined);
                }}
              />
              <DataField
                label={t("contribution.dataFields.website")}
                id="dataWebsite"
                type="url"
                value={data.website ?? ""}
                onChange={(e) => {
                  setDataField("website", e.target.value || undefined);
                }}
              />
              <DataField
                label={t("contribution.dataFields.address")}
                id="dataAddress"
                type="text"
                value={data.address ?? ""}
                onChange={(e) => {
                  setDataField("address", e.target.value || undefined);
                }}
              />
              <DataField
                label={t("contribution.dataFields.phone")}
                id="dataPhone"
                type="tel"
                value={data.phone ?? ""}
                onChange={(e) => {
                  setDataField("phone", e.target.value || undefined);
                }}
              />
              <DataField
                label={t("contribution.dataFields.email")}
                id="dataEmail"
                type="email"
                value={data.email ?? ""}
                onChange={(e) => {
                  setDataField("email", e.target.value || undefined);
                }}
              />
            </>
          )}

          {entityType === "FACULTY" && (
            <>
              <DataField
                label={t("contribution.dataFields.city")}
                id="dataFacultyCity"
                type="text"
                value={data.city ?? ""}
                onChange={(e) => {
                  setDataField("city", e.target.value || undefined);
                }}
              />
              <DataField
                label={t("contribution.dataFields.website")}
                id="dataFacultyWebsite"
                type="url"
                value={data.website ?? ""}
                onChange={(e) => {
                  setDataField("website", e.target.value || undefined);
                }}
              />
              <DataField
                label={t("contribution.dataFields.address")}
                id="dataFacultyAddress"
                type="text"
                value={data.address ?? ""}
                onChange={(e) => {
                  setDataField("address", e.target.value || undefined);
                }}
              />
              <DataField
                label={t("contribution.dataFields.phone")}
                id="dataFacultyPhone"
                type="tel"
                value={data.phone ?? ""}
                onChange={(e) => {
                  setDataField("phone", e.target.value || undefined);
                }}
              />
              <DataField
                label={t("contribution.dataFields.email")}
                id="dataFacultyEmail"
                type="email"
                value={data.email ?? ""}
                onChange={(e) => {
                  setDataField("email", e.target.value || undefined);
                }}
              />
            </>
          )}

          {entityType === "STUDY_PROGRAM" && (
            <>
              <div className="flex flex-col gap-1">
                <Label htmlFor="dataCycle">
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
          )}

          {entityType === "TRACK" && (
            <>
              <DataField
                label={t("contribution.dataFields.ects")}
                id="dataTrackEcts"
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
                id="dataTrackDuration"
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
          )}
        </fieldset>
      )}
      <Button type="submit" loading={loading} className="max-w-xs self-center">
        {t("contribution.submitSuggestion")}
      </Button>
    </form>
  );
}

export { AddUniversityEntity };
