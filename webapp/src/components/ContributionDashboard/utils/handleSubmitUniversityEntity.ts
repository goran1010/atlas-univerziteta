import { contributionSubmissionSchema } from "../../../schemas/contribution";

import type { z } from "zod";
import { pendingChangeResponseSchema } from "../../../schemas/pendingChange";
import { apiMutation } from "../../../utils/apiMutation";

import type { RequestContext } from "../../../types";
import type { TypeOfChange } from "../../../schemas/domain";
import type { ContributionFormDraft } from "../types";

export interface HandleSubmitUniversityEntityParams {
  targetType: string;
  parentId?: string;
  targetId?: string;
  typeOfChange: TypeOfChange;
  data: ContributionFormDraft;
  comment?: string;
  onSuccess: () => void;
  ctx: RequestContext;
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
  parentId?: string;
  targetId?: string;
  typeOfChange: TypeOfChange;
  data: ContributionFormDraft;
  comment?: string;
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
  comment,
  onSuccess,
  ctx,
}: HandleSubmitUniversityEntityParams) {
  const parsed = contributionSubmissionSchema.safeParse(
    buildSubmissionInput({
      targetType,
      parentId,
      targetId,
      typeOfChange,
      data,
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

export { handleSubmitUniversityEntity };
