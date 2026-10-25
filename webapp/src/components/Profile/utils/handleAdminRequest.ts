import { actionSuccessResponseSchema } from "../../../schemas/api";
import { requestAdminResponseSchema } from "../../../schemas/adminRequest";
import { apiMutation } from "../../../utils/apiMutation";

import type { RequestContext } from "../../../types";
import type { UserData } from "../../../types";
import type { Dispatch, SetStateAction } from "react";

async function handleRequestAdmin(
  setUserData: Dispatch<SetStateAction<UserData>>,
  ctx: RequestContext,
  reason?: string,
) {
  const trimmedReason = reason?.trim() ? reason.trim() : undefined;
  const result = await apiMutation(
    {
      path: "/users/request-admin",
      method: "POST",
      body: trimmedReason === undefined ? undefined : { reason: trimmedReason },
      responseSchema: requestAdminResponseSchema,
      successMessageKey: "messages.adminRequest.requestSuccess",
      errorMessageKey: "messages.adminRequest.requestError",
      logLabel: "request admin access",
    },
    ctx,
  );
  if (!result) return;

  setUserData(
    (prev) =>
      prev && { ...prev, adminRequestedAt: result.data.adminRequestedAt },
  );
}

async function handleCancelAdminRequest(
  setUserData: Dispatch<SetStateAction<UserData>>,
  ctx: RequestContext,
) {
  const result = await apiMutation(
    {
      path: "/users/request-admin",
      method: "DELETE",
      responseSchema: actionSuccessResponseSchema,
      successMessageKey: "messages.adminRequest.cancelSuccess",
      errorMessageKey: "messages.adminRequest.cancelError",
      logLabel: "cancel admin request",
    },
    ctx,
  );
  if (!result) return;

  setUserData((prev) => prev && { ...prev, adminRequestedAt: null });
}

export { handleRequestAdmin, handleCancelAdminRequest };
