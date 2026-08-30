import { contributionSubmissionSchema } from "../../../schemas/contribution";
import { pendingChangeResponseSchema } from "../../../schemas/pendingChange";
import { apiMutation } from "../../../utils/apiMutation";

import type { RequestContext } from "../../../utils/apiMutation";
import type { ContributionFormDraft, PendingChange } from "../types";
import type { Dispatch, SetStateAction } from "react";

export interface HandleSubmitUniversityEntityParams {
  entityType: string;
  parentId?: string;
  targetId?: string;
  typeOfChange: "CREATE" | "UPDATE" | "DELETE";
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
  const submissionInput =
    typeOfChange === "CREATE" && entityType === "UNIVERSITY"
      ? { entityType, typeOfChange, data }
      : typeOfChange === "CREATE"
        ? { entityType, typeOfChange, parentId, data }
        : typeOfChange === "UPDATE"
          ? { entityType, typeOfChange, targetId, data }
          : { entityType, typeOfChange, targetId };

  const parsed = contributionSubmissionSchema.safeParse(submissionInput);
  if (!parsed.success) {
    ctx.addNotification({
      type: "error",
      message: ctx.t("messages.universities.addError"),
    });
    console.error("Error submitting university entity:", parsed.error);
    return;
  }
  const submission = parsed.data;

  const method =
    submission.typeOfChange === "CREATE"
      ? "POST"
      : submission.typeOfChange === "UPDATE"
        ? "PUT"
        : "DELETE";
  const body =
    submission.typeOfChange === "CREATE"
      ? "parentId" in submission
        ? {
            entityType: submission.entityType,
            parentId: submission.parentId,
            data: submission.data,
          }
        : { entityType: submission.entityType, data: submission.data }
      : submission.typeOfChange === "UPDATE"
        ? {
            entityType: submission.entityType,
            targetId: submission.targetId,
            data: submission.data,
          }
        : {
            entityType: submission.entityType,
            targetId: submission.targetId,
          };

  const result = await apiMutation(
    {
      path: "/users/contribution/universities",
      method,
      body,
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
