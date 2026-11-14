import { use } from "react";
import { Helmet } from "react-helmet-async";
import { RootContext } from "../../contextData/RootContext";
import { SITE_URL } from "../../utils/envConfig";
import { UnifiedSearch } from "../Search/UnifiedSearch";

function HomePage() {
  const { t } = use(RootContext);
  const pageTitle = t("title.app");

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={t("meta.home")} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={t("meta.home")} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={t("meta.home")} />
      </Helmet>

      <div className="w-full mx-auto px-1 sm:px-4 flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-(--text-secondary)">
          {t("universitiesPage.title")}
        </h1>
        <div className="w-full">
          <UnifiedSearch />
        </div>
      </div>
    </>
  );
}

export { HomePage };
