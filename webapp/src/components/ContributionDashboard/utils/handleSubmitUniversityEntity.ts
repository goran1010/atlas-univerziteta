import { contributionSubmissionSchema } from "../../../schemas/contribution";

import type { z } from "zod";
import { pendingChangeResponseSchema } from "../../../schemas/pendingChange";
import { apiMutation } from "../../../utils/apiMutation";

import type { RequestContext } from "../../../types";
import type { TargetType, TypeOfChange } from "../../../schemas/domain";
import type { ContributionFormDraft } from "../types";

type ContributionEditDelta = {
  [K in keyof ContributionFormDraft]?: ContributionFormDraft[K] | null;
};

export interface HandleSubmitUniversityEntityParams {
  targetType: string;
  parentId?: string | undefined;
  targetId?: string | undefined;
  typeOfChange: TypeOfChange;
  data: ContributionFormDraft;
  // the update target's current values; when present, only changed fields
  // are submitted and emptied clearable fields are sent as null
  baseline?: ContributionFormDraft | undefined;
  comment?: string | undefined;
  onSuccess: () => void;
  ctx: RequestContext;
}

// fields the server's edit schemas accept as null (clearable); emptying any
// other field is treated as leaving it unchanged
const CLEARABLE_FIELDS: Record<TargetType, ReadonlySet<string>> = {
  UNIVERSITY: new Set([
    "acronym",
    "foundedYear",
    "website",
    "address",
    "phone",
    "email",
  ]),
  FACULTY: new Set(["city", "website", "address", "phone", "email"]),
  STUDY_PROGRAM: new Set(["durationYears", "ects", "language"]),
  TRACK: new Set(["ects", "durationYears"]),
};

const DRAFT_KEYS = [
  "name",
  "city",
  "entity",
  "ownership",
  "acronym",
  "foundedYear",
  "website",
  "address",
  "phone",
  "email",
  "cycle",
  "durationYears",
  "ects",
  "language",
] as const;

function buildEditDelta(
  draft: ContributionFormDraft,
  baseline: ContributionFormDraft,
  targetType: string,
): ContributionEditDelta {
  const delta: Record<string, unknown> = {};
  const clearable =
    targetType in CLEARABLE_FIELDS
      ? CLEARABLE_FIELDS[targetType as TargetType]
      : new Set<string>();

  for (const key of DRAFT_KEYS) {
    const next = draft[key];
    const base = baseline[key];
    const isEmptied = next === undefined || next === "";

    if (isEmptied) {
      if (base !== undefined && clearable.has(key)) delta[key] = null;
      continue;
    }
    if (base === undefined || String(next) !== String(base)) {
      delta[key] = next;
    }
  }

  return delta;
}

type ContributionSubmission = z.infer<typeof contributionSubmissionSchema>;

function buildSubmissionInput({
  targetType,
  parentId,
  targetId,
  typeOfChange,
  data,
  comment,
}: {
  targetType: string;
  parentId?: string | undefined;
  targetId?: string | undefined;
  typeOfChange: TypeOfChange;
  data: ContributionFormDraft | ContributionEditDelta;
  comment?: string | undefined;
}) {
  const trimmedComment = comment?.trim() ? comment.trim() : undefined;
  if (typeOfChange === "CREATE" && targetType === "UNIVERSITY") {
    return { targetType, typeOfChange, data, comment: trimmedComment };
  }
  if (typeOfChange === "CREATE") {
    return {
      targetType,
      typeOfChange,
      parentId,
      data,
      comment: trimmedComment,
    };
  }
  if (typeOfChange === "UPDATE") {
    return {
      targetType,
      typeOfChange,
      targetId,
      data,
      comment: trimmedComment,
    };
  }
  return { targetType, typeOfChange, targetId, comment: trimmedComment };
}

const METHOD_FOR_CHANGE = {
  CREATE: "POST",
  UPDATE: "PUT",
  DELETE: "DELETE",
} as const;

// JSON.stringify drops undefined values, so an absent comment never reaches
// the server's strict schemas
function buildRequestBody(submission: ContributionSubmission) {
  if (submission.typeOfChange === "CREATE") {
    if ("parentId" in submission) {
      return {
        targetType: submission.targetType,
        parentId: submission.parentId,
        data: submission.data,
        comment: submission.comment,
      };
    }
    return {
      targetType: submission.targetType,
      data: submission.data,
      comment: submission.comment,
    };
  }
  if (submission.typeOfChange === "UPDATE") {
    return {
      targetType: submission.targetType,
      targetId: submission.targetId,
      data: submission.data,
      comment: submission.comment,
    };
  }
  return {
    targetType: submission.targetType,
    targetId: submission.targetId,
    comment: submission.comment,
  };
}

async function handleSubmitUniversityEntity({
  targetType,
  parentId,
  targetId,
  typeOfChange,
  data,
  baseline,
  comment,
  onSuccess,
  ctx,
}: HandleSubmitUniversityEntityParams) {
  let submissionData: ContributionFormDraft | ContributionEditDelta = data;
  if (typeOfChange === "UPDATE" && baseline) {
    submissionData = buildEditDelta(data, baseline, targetType);
    if (Object.keys(submissionData).length === 0) {
      ctx.addNotification({
        type: "error",
        message: ctx.t("messages.apiError.noChanges"),
      });
      return;
    }
  }

  const parsed = contributionSubmissionSchema.safeParse(
    buildSubmissionInput({
      targetType,
      parentId,
      targetId,
      typeOfChange,
      data: submissionData,
      comment,
    }),
  );
  if (!parsed.success) {
    ctx.addNotification({
      type: "error",
      message: ctx.t("messages.universities.addError"),
    });
    console.error("Error submitting university entity:", parsed.error);
    return;
  }
  const submission = parsed.data;

  const result = await apiMutation(
    {
      path: "/users/contribution/universities",
      method: METHOD_FOR_CHANGE[submission.typeOfChange],
      body: buildRequestBody(submission),
      responseSchema: pendingChangeResponseSchema,
      successMessageKey: "messages.universities.addSuccess",
      errorMessageKey: "messages.universities.addError",
      logLabel: "submit university change",
    },
    ctx,
  );
  if (!result) return;

  onSuccess();
}

export { handleSubmitUniversityEntity, buildEditDelta };
