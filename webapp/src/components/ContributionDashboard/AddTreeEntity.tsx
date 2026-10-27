import { useRef, useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { Select } from "../sharedComponents/Select";
import { Textarea } from "../sharedComponents/Textarea";
import { Label } from "../sharedComponents/Label";
import { Button } from "../sharedComponents/Button";
import { DividerOr } from "../sharedComponents/DividerOr";
import { TargetPicker } from "./TargetPicker";
import { UploadIcon } from "../sharedComponents/icons";
import { PendingChangeDetail } from "../AdminDashboard/PendingChangeDetail";
import { getPickerDepth } from "./utils/getPickerDepth";
import { handleSubmitTree } from "./utils/handleSubmitTree";
import {
  facultyTreeDataSchema,
  studyProgramTreeDataSchema,
  universityTreeDataSchema,
} from "../../schemas/contribution";

import type { ChangeEvent, SubmitEvent } from "react";
import type {
  FacultyTreeData,
  StudyProgramTreeData,
  UniversityTreeData,
} from "../../schemas/contribution";

type TreeRootType = "UNIVERSITY" | "FACULTY" | "STUDY_PROGRAM";
type TreeData = UniversityTreeData | FacultyTreeData | StudyProgramTreeData;

const TREE_ROOT_TYPES: TreeRootType[] = [
  "UNIVERSITY",
  "FACULTY",
  "STUDY_PROGRAM",
];

const JSON_PLACEHOLDER: Record<TreeRootType, string> = {
  UNIVERSITY: `{
  "name": "...",
  "city": "...",
  "entity": "FBIH",
  "ownership": "PUBLIC",
  "faculties": [
    {
      "name": "...",
      "studyPrograms": [
        { "name": "...", "cycle": "FIRST", "tracks": [{ "name": "..." }] }
      ]
    }
  ]
}`,
  FACULTY: `{
  "name": "...",
  "studyPrograms": [
    { "name": "...", "cycle": "FIRST", "tracks": [{ "name": "..." }] }
  ]
}`,
  STUDY_PROGRAM: `{
  "name": "...",
  "cycle": "FIRST",
  "tracks": [{ "name": "..." }]
}`,
};

interface ValidationIssue {
  path: string;
  message: string;
}

function parseTree(rootType: TreeRootType, raw: unknown) {
  if (rootType === "UNIVERSITY") return universityTreeDataSchema.safeParse(raw);
  if (rootType === "FACULTY") return facultyTreeDataSchema.safeParse(raw);
  return studyProgramTreeDataSchema.safeParse(raw);
}

function AddTreeEntity({
  refetchPendingChanges,
}: {
  refetchPendingChanges: () => void;
}) {
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const [rootType, setRootType] = useState<TreeRootType>("UNIVERSITY");
  const [parentId, setParentId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [comment, setComment] = useState("");
  const [parsed, setParsed] = useState<TreeData | null>(null);
  const [invalidJson, setInvalidJson] = useState(false);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerResetKey, setPickerResetKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsParent = rootType !== "UNIVERSITY";

  function clearValidation() {
    setParsed(null);
    setInvalidJson(false);
    setIssues([]);
  }

  function handleRootTypeChange(value: string) {
    setRootType(value as TreeRootType);
    setParentId("");
    clearValidation();
  }

  function handleJsonChange(value: string) {
    setJsonText(value);
    clearValidation();
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // allow re-picking the same file after an edit
    e.target.value = "";
    if (!file) return;
    handleJsonChange(await file.text());
  }

  function handleValidate() {
    clearValidation();

    let raw: unknown;
    try {
      raw = JSON.parse(jsonText);
    } catch {
      setInvalidJson(true);
      return;
    }

    const result = parseTree(rootType, raw);
    if (!result.success) {
      setIssues(
        result.error.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message,
        })),
      );
      return;
    }

    setParsed(result.data);
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!parsed) return;

    await handleSubmitTree({
      targetType: rootType,
      ...(needsParent && { parentId: Number(parentId) }),
      data: parsed,
      comment,
      onSuccess: () => {
        setJsonText("");
        setComment("");
        setParentId("");
        clearValidation();
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
      <p className="text-sm text-(--text-secondary)">
        {t("contribution.tree.help")}
      </p>
      <div className="flex flex-col gap-1 items-center">
        <Label htmlFor="treeRootType" required>
          {t("contribution.entityType")}
        </Label>
        <Select
          id="treeRootType"
          name="treeRootType"
          value={rootType}
          onChange={(e) => {
            handleRootTypeChange(e.target.value);
          }}
          required
        >
          {TREE_ROOT_TYPES.map((et) => (
            <option key={et} value={et}>
              {t(`contribution.entityTypes.${et}`)}
            </option>
          ))}
        </Select>
      </div>
      {needsParent && (
        <TargetPicker
          key={`${rootType}-${String(pickerResetKey)}`}
          depth={getPickerDepth(rootType, "CREATE")}
          legend={t("contribution.picker.parent")}
          showSelectedDetails={false}
          onSelect={setParentId}
        />
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor="treeJson" required>
          {t("contribution.tree.jsonLabel")}
        </Label>
        <Textarea
          id="treeJson"
          name="treeJson"
          rows={14}
          className="font-mono text-xs placeholder:opacity-60"
          placeholder={JSON_PLACEHOLDER[rootType]}
          value={jsonText}
          onChange={(e) => {
            handleJsonChange(e.target.value);
          }}
        />
        <DividerOr />
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-2 sm:py-1.5 text-xs self-center w-full max-w-xs sm:w-auto"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="mr-1.5" />
          {t("contribution.tree.loadFile")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={(e) => void handleFile(e)}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      {invalidJson && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {t("contribution.tree.invalidJson")}
        </p>
      )}
      {issues.length > 0 && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2 sm:p-3"
        >
          <p className="text-xs font-semibold text-red-800 dark:text-red-300">
            {t("contribution.tree.validationErrors")}
          </p>
          <ul className="text-xs font-mono text-red-700 dark:text-red-300 flex flex-col gap-0.5">
            {issues.map((issue, index) => (
              <li key={`${issue.path}-${String(index)}`} className="break-all">
                {issue.path ? `${issue.path}: ` : ""}
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        className="w-full max-w-xs self-center"
        onClick={handleValidate}
        disabled={jsonText.trim() === ""}
      >
        {t("contribution.tree.validate")}
      </Button>
      {parsed && (
        <div className="flex flex-col gap-1 rounded-lg border border-(--border-color) p-2 sm:p-3">
          <p className="text-xs font-semibold text-(--text-secondary)">
            {t("contribution.tree.preview")}
          </p>
          <PendingChangeDetail
            targetType={rootType}
            typeOfChange="CREATE"
            data={parsed}
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor="treeComment">{t("contribution.comment")}</Label>
        <Textarea
          id="treeComment"
          name="treeComment"
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
          }}
        />
      </div>
      <Button
        type="submit"
        variant="success"
        loading={loading}
        disabled={!parsed || (needsParent && parentId === "")}
        className="w-full max-w-xs self-center"
      >
        {t("contribution.submitSuggestion")}
      </Button>
    </form>
  );
}

export { AddTreeEntity };
