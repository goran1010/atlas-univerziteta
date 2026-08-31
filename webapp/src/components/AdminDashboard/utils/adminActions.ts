import { actionSuccessResponseSchema } from "../../../schemas/api";
import { apiMutation } from "../../../utils/apiMutation";

import type { RequestContext } from "../../../utils/apiMutation";
import type { AdminPendingChange } from "../../../schemas/pendingChange";
import type { AdminRequest } from "../../../schemas/adminRequest";
import type { Dispatch, SetStateAction } from "react";

async function handleApprovePendingChange(
  change: AdminPendingChange,
  setPendingChanges: Dispatch<SetStateAction<AdminPendingChange[]>>,
  ctx: RequestContext,
) {
  const result = await apiMutation(
    {
      path: "/users/admin/approve-pending-change",
      method: "POST",
      body: { id: change.id },
      responseSchema: actionSuccessResponseSchema,
      successMessageKey: "messages.admin.approveSuccess",
      errorMessageKey: "messages.admin.approveError",
      logLabel: "approve pending change",
    },
    ctx,
  );
  if (!result) return;

  setPendingChanges((prev) => prev.filter((c) => c.id !== change.id));
}

async function handleDeclinePendingChange(
  change: AdminPendingChange,
  setPendingChanges: Dispatch<SetStateAction<AdminPendingChange[]>>,
  ctx: RequestContext,
) {
  const result = await apiMutation(
    {
      path: "/users/admin/decline-pending-change",
      method: "DELETE",
      body: { id: change.id },
      responseSchema: actionSuccessResponseSchema,
      successMessageKey: "messages.admin.declineSuccess",
      errorMessageKey: "messages.admin.declineError",
      logLabel: "decline pending change",
    },
    ctx,
  );
  if (!result) return;

  setPendingChanges((prev) => prev.filter((c) => c.id !== change.id));
}

async function handleApproveAdminRequest(
  adminRequest: AdminRequest,
  setAdminRequests: Dispatch<SetStateAction<AdminRequest[]>>,
  ctx: RequestContext,
) {
  const result = await apiMutation(
    {
      path: "/users/admin/approve-admin-request",
      method: "POST",
      body: { id: adminRequest.id },
      responseSchema: actionSuccessResponseSchema,
      successMessageKey: "messages.adminRequest.approveSuccess",
      errorMessageKey: "messages.adminRequest.approveError",
      logLabel: "approve admin request",
    },
    ctx,
  );
  if (!result) return;

  setAdminRequests((prev) =>
    prev.filter((request) => request.id !== adminRequest.id),
  );
}

async function handleDeclineAdminRequest(
  adminRequest: AdminRequest,
  setAdminRequests: Dispatch<SetStateAction<AdminRequest[]>>,
  ctx: RequestContext,
) {
  const result = await apiMutation(
    {
      path: "/users/admin/decline-admin-request",
      method: "DELETE",
      body: { id: adminRequest.id },
      responseSchema: actionSuccessResponseSchema,
      successMessageKey: "messages.adminRequest.declineSuccess",
      errorMessageKey: "messages.adminRequest.declineError",
      logLabel: "decline admin request",
    },
    ctx,
  );
  if (!result) return;

  setAdminRequests((prev) =>
    prev.filter((request) => request.id !== adminRequest.id),
  );
}

export {
  handleApprovePendingChange,
  handleDeclinePendingChange,
  handleApproveAdminRequest,
  handleDeclineAdminRequest,
};
