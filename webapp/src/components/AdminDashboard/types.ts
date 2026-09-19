import type { AdminPendingChange } from "../../schemas/pendingChange";
import type { AdminRequest } from "../../schemas/adminRequest";
import type { Dispatch, SetStateAction } from "react";

export interface AdminOutletContext {
  pendingChanges: AdminPendingChange[];
  setPendingChanges: Dispatch<SetStateAction<AdminPendingChange[]>>;
  pendingLoading: boolean;
  adminRequests: AdminRequest[];
  setAdminRequests: Dispatch<SetStateAction<AdminRequest[]>>;
  requestsLoading: boolean;
}
