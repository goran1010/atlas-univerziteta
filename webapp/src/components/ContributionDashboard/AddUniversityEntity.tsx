import { useState, useRef, use } from "react";
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
import { fetchTargetDraft } from "./utils/updatePrefill";
import {
  FacultyListEditor,
  StudyProgramListEditor,
  TrackListEditor,
} from "./TreeBuilder";
import {
  buildFacultyPayload,
  buildStudyProgramPayload,
  buildTrackPayload,
} from "./utils/treeDrafts";
import {
  facultyTreeDataSchema,
  studyProgramTreeDataSchema,
  universityTreeDataSchema,
} from "../../schemas/contribution";
import type { TargetType, TypeOfChange } from "../../schemas/domain";
import type { ContributionFormDraft, ContributionFormState } from "./types";
import type {
  FacultyDraft,
  StudyProgramDraft,
  TrackDraft,
} from "./utils/treeDrafts";
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
  const [baseline, setBaseline] = useState<ContributionFormDraft>();
  const [loading, setLoading] = useState(false);
  const [pickerResetKey, setPickerResetKey] = useState(0);
  // optional CREATE children, one list per possible root type
  const [childFaculties, setChildFaculties] = useState<FacultyDraft[]>([]);
  const [childPrograms, setChildPrograms] = useState<StudyProgramDraft[]>([]);
  const [childTracks, setChildTracks] = useState<TrackDraft[]>([]);
  const [treeIssues, setTreeIssues] = useState<
    { path: string; message: string }[]
  >([]);
  // guards prefill responses against a target re-picked mid-flight
  const targetIdRef = useRef("");

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
      data: {},
    }));
    setBaseline(undefined);
    setChildFaculties([]);
    setChildPrograms([]);
    setChildTracks([]);
    setTreeIssues([]);
    targetIdRef.current = "";
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

  async function prefillTarget(id: string) {
    setBaseline(undefined);
    if (!id) {
      setFormState((prev) => ({ ...prev, data: {} }));
      return;
    }

    const draft = await fetchTargetDraft(targetType, id, {
      addNotification,
      setLoading: () => undefined,
      t,
    });
    if (!draft || targetIdRef.current !== id) return;

    setBaseline(draft);
    setFormState((prev) => ({ ...prev, data: draft }));
  }

  // a CREATE with children submits the whole subtree; validating here lets
  // errors point at the offending node instead of a generic failure
  function buildTreeSubmission(): ContributionFormDraft | null {
    if (typeOfChange !== "CREATE") return data;

    if (targetType === "UNIVERSITY" && childFaculties.length > 0) {
      const result = universityTreeDataSchema.safeParse({
        ...data,
        faculties: childFaculties.map(buildFacultyPayload),
      });
      if (!result.success) {
        setTreeIssues(
          result.error.issues.map((issue) => ({
            path: issue.path.map(String).join("."),
            message: issue.message,
          })),
        );
        return null;
      }
      return result.data;
    }

    if (targetType === "FACULTY" && childPrograms.length > 0) {
      const result = facultyTreeDataSchema.safeParse({
        ...data,
        studyPrograms: childPrograms.map(buildStudyProgramPayload),
      });
      if (!result.success) {
        setTreeIssues(
          result.error.issues.map((issue) => ({
            path: issue.path.map(String).join("."),
            message: issue.message,
          })),
        );
        return null;
      }
      return result.data;
    }

    if (targetType === "STUDY_PROGRAM" && childTracks.length > 0) {
      const result = studyProgramTreeDataSchema.safeParse({
        ...data,
        tracks: childTracks.map(buildTrackPayload),
      });
      if (!result.success) {
        setTreeIssues(
          result.error.issues.map((issue) => ({
            path: issue.path.map(String).join("."),
            message: issue.message,
          })),
        );
        return null;
      }
      return result.data;
    }

    return data;
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setTreeIssues([]);

    const submissionData = buildTreeSubmission();
    if (submissionData === null) return;

    await handleSubmitUniversityEntity({
      targetType,
      parentId,
      targetId,
      typeOfChange,
      data: submissionData,
      baseline,
      comment,
      onSuccess: () => {
        setFormState(INIT_FORM);
        setBaseline(undefined);
        setChildFaculties([]);
        setChildPrograms([]);
        setChildTracks([]);
        targetIdRef.current = "";
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
            if (!needsParent && typeOfChange === "UPDATE") {
              targetIdRef.current = id;
              void prefillTarget(id);
            }
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
      {typeOfChange === "CREATE" && targetType === "UNIVERSITY" && (
        <FacultyListEditor
          faculties={childFaculties}
          onChange={(faculties) => {
            setChildFaculties(faculties);
            setTreeIssues([]);
          }}
        />
      )}
      {typeOfChange === "CREATE" && targetType === "FACULTY" && (
        <StudyProgramListEditor
          studyPrograms={childPrograms}
          idPrefix="root"
          onChange={(studyPrograms) => {
            setChildPrograms(studyPrograms);
            setTreeIssues([]);
          }}
        />
      )}
      {typeOfChange === "CREATE" && targetType === "STUDY_PROGRAM" && (
        <TrackListEditor
          tracks={childTracks}
          idPrefix="root"
          onChange={(tracks) => {
            setChildTracks(tracks);
            setTreeIssues([]);
          }}
        />
      )}
      {treeIssues.length > 0 && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2 sm:p-3"
        >
          <p className="text-xs font-semibold text-red-800 dark:text-red-300">
            {t("contribution.tree.validationErrors")}
          </p>
          <ul className="text-xs font-mono text-red-700 dark:text-red-300 flex flex-col gap-0.5">
            {treeIssues.map((issue, index) => (
              <li
                key={`${issue.path}-${index.toString()}`}
                className="break-all"
              >
                {issue.path ? `${issue.path}: ` : ""}
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
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
          ({ CREATE: "success", UPDATE: "update", DELETE: "danger" } as const)[
            typeOfChange
          ]
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
