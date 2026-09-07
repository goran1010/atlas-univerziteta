import { use } from "react";
import { Link } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { ContributionForm } from "./ContributionForm";
import { Helmet } from "react-helmet-async";

function ContributionDashboard() {
  const { userData, t } = use(RootContext);

  if (!userData) {
    return (
      <>
        <Helmet>
          <title>{`${t("title.contribute")} | ${t("title.app")}`}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <section className="relative h-full w-full flex flex-col items-center justify-center gap-4 p-3 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
          <h1 className="text-center text-(--text-secondary)">
            {t("contribution.needUser")}
          </h1>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/login"
              className="border rounded-lg px-4 py-2 transition-colors font-medium text-(--text-primary) hover:bg-(--hover-surface) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
            >
              {t("access.goToLogin")}
            </Link>
            <Link
              to="/"
              className="border rounded-lg px-4 py-2 transition-colors font-medium text-(--text-primary) hover:bg-(--hover-surface) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
            >
              {t("access.goHome")}
            </Link>
          </div>
        </section>
      </>
    );
  }
  return (
    <>
      <Helmet>
        <title>{`${t("title.contribute")} | ${t("title.app")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <ContributionForm />
    </>
  );
}

export { ContributionDashboard };
