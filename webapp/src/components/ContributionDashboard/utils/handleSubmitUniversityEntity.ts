import { contributionSubmissionSchema } from "../../../schemas/contribution";

import type { z } from "zod";
import { pendingChangeResponseSchema } from "../../../schemas/pendingChange";
import { apiMutation } from "../../../utils/apiMutation";

import type { RequestContext } from "../../../utils/apiMutation";
import type { TypeOfChange } from "../../../schemas/domain";
import type { PendingChange } from "../../../schemas/pendingChange";
import type { ContributionFormDraft } from "../types";
import type { Dispatch, SetStateAction } from "react";

export interface HandleSubmitUniversityEntityParams {
  entityType: string;
  parentId?: string;
  targetId?: string;
  typeOfChange: TypeOfChange;
  data: ContributionFormDraft;
  setPendingChanges: Dispatch<SetStateAction<PendingChange[]>>;
  setFormState: (formState: {
    entityType: string;
    parentId?: string;
    targetId?: string;
    data: ContributionFormDraft;
  }) => void;
  ctx: RequestContext;
}

type ContributionSubmission = z.infer<typeof contributionSubmissionSchema>;

function buildSubmissionInput({
  entityType,
  parentId,
  targetId,
  typeOfChange,
  data,
}: {
  entityType: string;
  parentId?: string;
  targetId?: string;
  typeOfChange: TypeOfChange;
  data: ContributionFormDraft;
}) {
  if (typeOfChange === "CREATE" && entityType === "UNIVERSITY") {
    return { entityType, typeOfChange, data };
  }
  if (typeOfChange === "CREATE") {
    return { entityType, typeOfChange, parentId, data };
  }
  if (typeOfChange === "UPDATE") {
    return { entityType, typeOfChange, targetId, data };
  }
  return { entityType, typeOfChange, targetId };
}

const METHOD_FOR_CHANGE = {
  CREATE: "POST",
  UPDATE: "PUT",
  DELETE: "DELETE",
} as const;

function buildRequestBody(submission: ContributionSubmission) {
  if (submission.typeOfChange === "CREATE") {
    if ("parentId" in submission) {
      return {
        entityType: submission.entityType,
        parentId: submission.parentId,
        data: submission.data,
      };
    }
    return { entityType: submission.entityType, data: submission.data };
  }
  if (submission.typeOfChange === "UPDATE") {
    return {
      entityType: submission.entityType,
      targetId: submission.targetId,
      data: submission.data,
    };
  }
  return { entityType: submission.entityType, targetId: submission.targetId };
}

async function handleSubmitUniversityEntity({
  entityType,
  parentId,
  targetId,
  typeOfChange,
  data,
  setPendingChanges,
  setFormState,
  ctx,
}: HandleSubmitUniversityEntityParams) {
  const parsed = contributionSubmissionSchema.safeParse(
    buildSubmissionInput({
      entityType,
      parentId,
      targetId,
      typeOfChange,
      data,
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

  setPendingChanges((prev) => [result.data, ...prev]);
  setFormState({ entityType: "", parentId: "", targetId: "", data: {} });
}

export { handleSubmitUniversityEntity };
