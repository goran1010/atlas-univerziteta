import { actionSuccessResponseSchema } from "../../../schemas/api";
import { apiMutation } from "../../../utils/apiMutation";

import type { RequestContext } from "../../../utils/apiMutation";
import type { PendingChange } from "../types";
import type { Dispatch, SetStateAction } from "react";

async function handleDiscardUniversityChange(
  changeId: string,
  setPendingChanges: Dispatch<SetStateAction<PendingChange[]>>,
  ctx: RequestContext,
) {
  const result = await apiMutation(
    {
      path: "/users/contribution/pending-changes/universities",
      method: "DELETE",
      body: { id: changeId },
      responseSchema: actionSuccessResponseSchema,
      successMessageKey: "messages.universities.deleteSuccess",
      errorMessageKey: "messages.universities.deleteError",
      logLabel: "discard pending change",
    },
    ctx,
  );
  if (!result) return;

  setPendingChanges((prev) => prev.filter((c) => c.id !== changeId));
}

export { handleDiscardUniversityChange };
