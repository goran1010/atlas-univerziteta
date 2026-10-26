import { LinkButton } from "../sharedComponents/LinkButton";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { use, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useUsersList } from "../../customHooks/useUsersList";
import { pendingChangesResponseSchema } from "../../schemas/pendingChange";
import { handleLogout } from "./utils/handleLogout";
import {
  handleRequestAdmin,
  handleCancelAdminRequest,
} from "./utils/handleAdminRequest";
import { Button } from "../sharedComponents/Button";
import { Label } from "../sharedComponents/Label";
import { Textarea } from "../sharedComponents/Textarea";
import { Helmet } from "react-helmet-async";

function Profile() {
  const { userData, setUserData, t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const [loading, setLoading] = useState(false);
  const [adminRequestLoading, setAdminRequestLoading] = useState(false);
  const [adminRequestReason, setAdminRequestReason] = useState("");
  const [pendingCountLoading, setPendingCountLoading] = useState(true);
  const navigate = useNavigate();

  const isAdmin = userData?.role === "ADMIN";
  const [pendingItems] = useUsersList({
    path: isAdmin
      ? "/users/admin/pending-changes"
      : "/users/contribution/pending-changes/universities",
    responseSchema: pendingChangesResponseSchema,
    errorMessageKey: "messages.pendingChanges.fetchError",
    logLabel: "fetch pending count",
    setLoading: setPendingCountLoading,
    enabled: !!userData,
  });

  const adminRequestCtx = {
    addNotification,
    setLoading: setAdminRequestLoading,
    t,
  };
  const logoutCtx = { addNotification, setLoading, t };

  if (!userData) {
    return (
      <>
        <Helmet>
          <title>{`${t("title.profile")} | ${t("title.app")}`}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <section className="relative h-full w-full flex flex-col items-center justify-center gap-4 p-3 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-center text-(--text-secondary)">
            {t("profile.needLogin")}
          </h1>
          <div className="flex flex-wrap gap-3 justify-center">
            <LinkButton to="/login">{t("access.goToLogin")}</LinkButton>
            <LinkButton to="/">{t("access.goHome")}</LinkButton>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="flex flex-col flex-1 justify-center items-center h-full w-full">
      <Helmet>
        <title>{`${t("title.profile")} | ${t("title.app")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="w-full max-w-md overflow-hidden bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 p-4">
          <h1 className="text-2xl font-bold text-white text-center">
            {t("profile.title")}
          </h1>
        </div>
        <div className="p-4 flex flex-col gap-3 text-center items-center">
          <div className="flex flex-col items-center gap-1">
            {userData.image ? (
              <img
                src={userData.image}
                alt=""
                referrerPolicy="no-referrer"
                className="size-16 rounded-full border border-(--border-color)"
              />
            ) : (
              <div
                aria-hidden="true"
                className="size-16 rounded-full bg-indigo-600 dark:bg-indigo-800 text-white flex items-center justify-center text-2xl font-bold"
              >
                {userData.name.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-lg font-bold">{userData.name}</p>
          </div>
          <dl className="w-full flex flex-col gap-3">
            <div>
              <dt className="block text-sm font-semibold uppercase tracking-wide text-(--text-secondary)">
                {t("profile.emailAddress")}
              </dt>
              <dd className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-lg font-bold wrap-break-word">
                  {userData.email}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    userData.emailVerified
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  }`}
                >
                  {t(
                    userData.emailVerified
                      ? "profile.emailVerifiedBadge"
                      : "profile.emailNotVerifiedBadge",
                  )}
                </span>
              </dd>
            </div>
            <div>
              <dt className="block text-sm font-semibold uppercase tracking-wide text-(--text-secondary)">
                {t("profile.memberSince")}
              </dt>
              <dd className="text-lg font-bold">
                {new Date(userData.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="block text-sm font-semibold uppercase tracking-wide text-(--text-secondary)">
                {t("profile.currentRole")}
              </dt>
              <dd className="flex items-center justify-center">
                <span
                  className={`items-center px-4 py-2 rounded-full text-sm font-bold ${
                    userData.role === "ADMIN"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                  }`}
                >
                  {userData.role}
                </span>
              </dd>
            </div>
            {!pendingCountLoading && (
              <div>
                <dt className="block text-sm font-semibold uppercase tracking-wide text-(--text-secondary)">
                  {t(
                    isAdmin
                      ? "profile.changesAwaiting"
                      : "profile.suggestionsAwaiting",
                  )}
                </dt>
                <dd>
                  <Link
                    to={
                      isAdmin
                        ? "/admin-dashboard/pending-changes"
                        : "/improve-data/pending"
                    }
                    className="text-lg font-bold underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {String(pendingItems.length)}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
          {userData.role !== "ADMIN" && (
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {userData.adminRequestedAt ? (
                <>
                  <span className="px-4 py-2 rounded-full text-sm font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {`${t("profile.adminRequestPendingSince")} ${new Date(userData.adminRequestedAt).toLocaleDateString()}`}
                  </span>
                  {userData.adminRequestReason && (
                    <p className="text-sm italic text-(--text-secondary) whitespace-pre-wrap wrap-break-word">
                      {userData.adminRequestReason}
                    </p>
                  )}
                  <Button
                    onClick={() =>
                      void handleCancelAdminRequest(
                        setUserData,
                        adminRequestCtx,
                      )
                    }
                    variant="update"
                    className="px-6 py-3 font-semibold"
                    type="button"
                    loading={adminRequestLoading}
                  >
                    {t("profile.cancelAdminRequest")}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1 text-left">
                    <Label htmlFor="adminRequestReason">
                      {t("profile.adminRequestReason")}
                    </Label>
                    <Textarea
                      id="adminRequestReason"
                      name="adminRequestReason"
                      rows={3}
                      maxLength={1000}
                      value={adminRequestReason}
                      onChange={(e) => {
                        setAdminRequestReason(e.target.value);
                      }}
                    />
                  </div>
                  <Button
                    onClick={() =>
                      void handleRequestAdmin(
                        setUserData,
                        adminRequestCtx,
                        adminRequestReason,
                      )
                    }
                    variant="success"
                    className="px-6 py-3 font-semibold"
                    type="button"
                    loading={adminRequestLoading}
                  >
                    {t("profile.requestAdmin")}
                  </Button>
                </>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2 w-full max-w-sm">
            <Button
              onClick={() =>
                void handleLogout(navigate, setUserData, logoutCtx)
              }
              variant="danger"
              className="px-6 py-3 font-semibold"
              type="submit"
              loading={loading}
            >
              {t("profile.logout")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Profile };
