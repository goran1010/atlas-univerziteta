import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { Select } from "../sharedComponents/Select";
import { Textarea } from "../sharedComponents/Textarea";
import { Label } from "../sharedComponents/Label";
import { Button } from "../sharedComponents/Button";
import { DataField } from "./DataField";
import { TargetPicker } from "./TargetPicker";
import { UniversityFields } from "./fields/UniversityFields";
import { FacultyFields } from "./fields/FacultyFields";
import { StudyProgramFields } from "./fields/StudyProgramFields";
import { TrackFields } from "./fields/TrackFields";
import { getPickerDepth } from "./utils/getPickerDepth";
import { handleSubmitUniversityEntity } from "./utils/handleSubmitUniversityEntity";
import type { TargetType, TypeOfChange } from "../../schemas/domain";
import type { ContributionFormDraft, ContributionFormState } from "./types";
import type { SubmitEvent } from "react";

const INIT_FORM: ContributionFormState = {
  targetType: "UNIVERSITY",
  typeOfChange: "CREATE",
  parentId: "",
  targetId: "",
  data: {},
  comment: "",
};

const ENTITY_TYPES: TargetType[] = [
  "UNIVERSITY",
  "FACULTY",
  "STUDY_PROGRAM",
  "TRACK",
];

const TYPE_OF_CHANGES: TypeOfChange[] = ["CREATE", "UPDATE", "DELETE"];

function AddUniversityEntity({
  refetchPendingChanges,
}: {
  refetchPendingChanges: () => void;
}) {
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const [formState, setFormState] = useState(INIT_FORM);
  const [loading, setLoading] = useState(false);
  const [pickerResetKey, setPickerResetKey] = useState(0);

  const { targetType, typeOfChange, parentId, targetId, data, comment } =
    formState;

  function setField(field: keyof ContributionFormState, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  function setSelector(field: "targetType" | "typeOfChange", value: string) {
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

  const needsParent = typeOfChange === "CREATE" && targetType !== "UNIVERSITY";
  const needsTarget = typeOfChange !== "CREATE";
  const needsDataFields = typeOfChange !== "DELETE";

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    await handleSubmitUniversityEntity({
      targetType,
      parentId,
      targetId,
      typeOfChange,
      data,
      comment,
      onSuccess: () => {
        setFormState(INIT_FORM);
        setPickerResetKey((prev) => prev + 1);
        refetchPendingChanges();
      },
      ctx: { addNotification, setLoading, t },
    });
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-4 w-full max-w-lg"
    >
      <div className="flex flex-col gap-1 items-center">
        <Label htmlFor="targetType" required>
          {t("contribution.entityType")}
        </Label>
        <Select
          id="targetType"
          name="targetType"
          value={targetType}
          onChange={(e) => {
            setSelector("targetType", e.target.value);
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
        <Label htmlFor="typeOfChange" required>
          {t("contribution.change")}
        </Label>
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
        <TargetPicker
          key={`${targetType}-${typeOfChange}-${String(pickerResetKey)}`}
          depth={getPickerDepth(targetType, typeOfChange)}
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
            {t("contribution.dataLegend")}
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

          {targetType === "UNIVERSITY" && (
            <UniversityFields
              data={data}
              typeOfChange={typeOfChange}
              setDataField={setDataField}
            />
          )}

          {targetType === "FACULTY" && (
            <FacultyFields data={data} setDataField={setDataField} />
          )}

          {targetType === "STUDY_PROGRAM" && (
            <StudyProgramFields
              data={data}
              typeOfChange={typeOfChange}
              setDataField={setDataField}
            />
          )}

          {targetType === "TRACK" && (
            <TrackFields data={data} setDataField={setDataField} />
          )}
        </fieldset>
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor="contributionComment">{t("contribution.comment")}</Label>
        <Textarea
          id="contributionComment"
          name="comment"
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => {
            setField("comment", e.target.value);
          }}
        />
      </div>
      <Button
        type="submit"
        variant={
          typeOfChange === "CREATE"
            ? "success"
            : typeOfChange === "UPDATE"
              ? "update"
              : "danger"
        }
        loading={loading}
        className="w-full max-w-xs self-center"
      >
        {t("contribution.submitSuggestion")}
      </Button>
    </form>
  );
}

export { AddUniversityEntity };
