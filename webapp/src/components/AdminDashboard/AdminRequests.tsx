import { useFetchList } from "../../customHooks/useFetchList";
import { use, useState } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Spinner } from "../../utils/Spinner";
import { Button } from "../sharedComponents/Button";
import {
  handleApproveAdminRequest,
  handleDeclineAdminRequest,
} from "./utils/adminActions";
import { adminRequestsResponseSchema } from "../../schemas/adminRequest";

import type { RootContextType } from "../../contextData/RootContext";
import type { AdminRequest } from "../../schemas/adminRequest";
import type { Notification } from "../../types/notification";
import type { Dispatch, SetStateAction } from "react";

const panelClass =
  "py-3 px-1 sm:px-4 w-full bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm";

interface AdminRequestRowProps {
  adminRequest: AdminRequest;
  addNotification: (notification: Notification) => void;
  setAdminRequests: Dispatch<SetStateAction<AdminRequest[]>>;
  index: number;
}

function AdminRequestRow({
  adminRequest,
  addNotification,
  setAdminRequests,
  index,
}: AdminRequestRowProps) {
  const [loading, setLoading] = useState(false);
  const { t, serverStatus } = use(RootContext);
  const ctx = { addNotification, setLoading, t, serverStatus };

  return (
    <li
      className={`rounded-md transition-colors hover:bg-(--hover-surface) ${
        index % 2 === 0 ? "bg-(--surface-2)" : "bg-(--surface-alt)"
      }`}
    >
      <div className="grid gap-2 w-full p-1 sm:gap-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex justify-between sm:justify-center items-center flex-wrap gap-1 min-w-0">
          <span className="sm:hidden font-semibold">
            {t("contribution.user")}
          </span>
          <span className="break-all">{adminRequest.email}</span>
        </div>
        <div className="flex justify-between sm:justify-center items-center flex-wrap gap-1">
          <span className="sm:hidden font-semibold">
            {t("admin.requestedAt")}
          </span>
          <span className="text-sm">
            {new Date(adminRequest.adminRequestedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex justify-center sm:flex-row gap-2 p-1">
        <Button
          variant="success"
          className="px-3 py-2 text-sm sm:max-w-25"
          onClick={() => {
            void handleApproveAdminRequest(adminRequest, setAdminRequests, ctx);
          }}
          type="button"
          loading={loading}
        >
          {t("form.approve")}
        </Button>
        <Button
          variant="danger"
          className="px-3 py-2 text-sm sm:max-w-25"
          onClick={() => {
            void handleDeclineAdminRequest(adminRequest, setAdminRequests, ctx);
          }}
          type="button"
          loading={loading}
        >
          {t("form.reject")}
        </Button>
      </div>
    </li>
  );
}

function AdminRequests() {
  const [loading, setLoading] = useState(true);

  const { addNotification, t } = use<RootContextType>(RootContext);
  const [adminRequests, setAdminRequests] = useFetchList({
    path: "/users/admin/admin-requests",
    responseSchema: adminRequestsResponseSchema,
    errorMessageKey: "messages.adminRequest.fetchError",
    logLabel: "fetch admin requests",
    setLoading,
  });

  if (loading) {
    return <Spinner />;
  }

  if (!adminRequests.length) {
    return (
      <section className="flex flex-col justify-center items-center p-1 w-full">
        <p className="text-(--text-secondary)">{t("admin.noAdminRequests")}</p>
      </section>
    );
  }

  return (
    <section className={panelClass}>
      <h2 className="text-md text-center font-semibold flex items-center gap-1 p-1 flex-1">
        <span
          aria-label={t("admin.adminRequestsCountAria")}
          className="px-2 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
        >
          {adminRequests.length}
        </span>
        <span className="flex-1">{t("admin.adminRequests")}</span>
      </h2>

      <section className="flex flex-col justify-center items-center p-1 w-full">
        <ul className="w-full max-w-4xl flex flex-col border border-(--border-strong) rounded-md p-2 bg-(--surface-2) gap-1">
          <li className="hidden sm:grid sm:gap-1 text-center w-full p-2 border border-(--border-strong) rounded-md font-bold text-(--text-primary) bg-(--surface-3) sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div>{t("contribution.user")}</div>
            <div>{t("admin.requestedAt")}</div>
          </li>
          {adminRequests.map((adminRequest, index) => (
            <AdminRequestRow
              key={adminRequest.id}
              adminRequest={adminRequest}
              addNotification={addNotification}
              setAdminRequests={setAdminRequests}
              index={index}
            />
          ))}
        </ul>
      </section>
    </section>
  );
}

export { AdminRequests };
