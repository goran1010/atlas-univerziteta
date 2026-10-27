import { pendingChangeResponseSchema } from "../../../schemas/pendingChange";
import { apiMutation } from "../../../utils/apiMutation";

import type { RequestContext } from "../../../types";
import type {
  FacultyTreeData,
  StudyProgramTreeData,
  UniversityTreeData,
} from "../../../schemas/contribution";

interface HandleSubmitTreeParams {
  targetType: "UNIVERSITY" | "FACULTY" | "STUDY_PROGRAM";
  parentId?: number;
  data: UniversityTreeData | FacultyTreeData | StudyProgramTreeData;
  comment?: string;
  onSuccess: () => void;
  ctx: RequestContext;
}

// JSON.stringify drops undefined values, so an absent parentId or comment
// never reaches the server's strict schemas
async function handleSubmitTree({
  targetType,
  parentId,
  data,
  comment,
  onSuccess,
  ctx,
}: HandleSubmitTreeParams) {
  const result = await apiMutation(
    {
      path: "/users/contribution/universities",
      method: "POST",
      body: {
        targetType,
        parentId,
        data,
        comment: comment?.trim() ? comment.trim() : undefined,
      },
      responseSchema: pendingChangeResponseSchema,
      successMessageKey: "messages.universities.addSuccess",
      errorMessageKey: "messages.universities.addError",
      logLabel: "submit tree contribution",
    },
    ctx,
  );
  if (!result) return;

  onSuccess();
}

export { handleSubmitTree };
