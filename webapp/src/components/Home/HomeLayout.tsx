import { use } from "react";
import { Outlet } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../utils/envConfig";

function HomeLayout() {
  const { t } = use(RootContext);

  return (
    <>
      <Helmet>
        <title>{`${t("title.universities")} | ${t("title.app")}`}</title>
        <meta name="description" content={t("meta.universities")} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta
          property="og:title"
          content={`${t("title.universities")} | ${t("title.app")}`}
        />
        <meta property="og:description" content={t("meta.universities")} />
        <meta
          name="twitter:title"
          content={`${t("title.universities")} | ${t("title.app")}`}
        />
        <meta name="twitter:description" content={t("meta.universities")} />
      </Helmet>

      <div className="w-full mx-auto px-1 sm:px-4 flex flex-col gap-2">
        <h1 className="text-center text-(--text-secondary)">
          {t("universitiesPage.title")}
        </h1>
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export { HomeLayout };
