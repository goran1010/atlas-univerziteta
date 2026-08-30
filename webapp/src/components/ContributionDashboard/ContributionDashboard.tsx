import { use } from "react";
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
        <section className="relative h-full w-full flex items-center justify-center p-3 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
          <h1 className="text-center text-(--text-secondary)">
            {t("contribution.needUser")}
          </h1>
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
