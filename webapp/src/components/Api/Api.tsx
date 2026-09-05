import { EndpointCard } from "./EndPointCard";
import { apiEndpoints } from "./utils/endpoints";
import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Helmet } from "react-helmet-async";
import { PUBLIC_API_URL, SITE_URL } from "../../utils/envConfig";

function Api() {
  const { t } = use(RootContext);

  return (
    <>
      <Helmet>
        <title>{`${t("title.api")} | ${t("title.app")}`}</title>
        <meta name="description" content={t("meta.api")} />
        <meta name="robots" content="index, follow" />
        <link
          rel="canonical"
          href={`${SITE_URL}/api-docs`}
        />
        <meta
          property="og:url"
          content={`${SITE_URL}/api-docs`}
        />
        <meta
          property="og:title"
          content={`${t("title.api")} | ${t("title.app")}`}
        />
        <meta property="og:description" content={t("meta.api")} />
        <meta
          name="twitter:title"
          content={`${t("title.api")} | ${t("title.app")}`}
        />
        <meta name="twitter:description" content={t("meta.api")} />
      </Helmet>
      <div className="w-full px-2 sm:px-4 flex flex-col gap-8 py-8 text-(--text-primary)">
        <header>
          <h1 className="text-3xl font-bold mb-3 text-center">
            {t("api.title")}
          </h1>
          <p>{t("api.publicIntro")}</p>
          <pre className="mt-3 bg-(--surface-alt) rounded p-3 text-sm font-mono overflow-x-auto border border-(--border-color)">
            {PUBLIC_API_URL}
          </pre>
          <p className="mt-2 text-sm text-(--text-muted)">
            {t("api.fullDocs")}{" "}
            <a
              href="https://github.com/goran1010/uniatlas-bosnia"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub README
            </a>
            .
          </p>
        </header>
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center">
            {t("api.dataObject")}
          </h2>
          <pre className="bg-(--surface-alt) rounded p-3 text-xs overflow-x-auto border border-(--border-color)">
            {t("api.dataObjectExample")}
          </pre>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center">
            {t("api.endpoints")}
          </h2>
          {apiEndpoints.map((ep) => (
            <EndpointCard key={ep.path} endpoint={ep} />
          ))}
        </section>
      </div>
    </>
  );
}

export { Api };
