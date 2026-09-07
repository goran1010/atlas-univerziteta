import { LinkButton } from "../sharedComponents/LinkButton";
import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { AdminForm } from "./AdminForm";
import { Helmet } from "react-helmet-async";

function AdminDashboard() {
  const { userData, t } = use(RootContext);

  if (userData?.role !== "ADMIN") {
    return (
      <>
        <Helmet>
          <title>{`${t("title.admin")} | ${t("title.app")}`}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <section className="relative h-full w-full flex flex-col items-center justify-center gap-4 p-3 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
          <h1 className="text-center text-(--text-secondary)">
            {userData ? t("admin.needAdmin") : t("admin.needLoginAndAdmin")}
          </h1>
          <div className="flex flex-wrap gap-3 justify-center">
            {!userData && (
              <LinkButton to="/login">{t("access.goToLogin")}</LinkButton>
            )}
            <LinkButton to="/">{t("access.goHome")}</LinkButton>
          </div>
        </section>
      </>
    );
  }
  return (
    <>
      <Helmet>
        <title>{`${t("title.admin")} | ${t("title.app")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminForm />
    </>
  );
}

export { AdminDashboard };
