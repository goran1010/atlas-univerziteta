import { LinkButton } from "../sharedComponents/LinkButton";
import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../utils/envConfig";
import { GitHubIcon } from "../sharedComponents/icons";
import { ExternalLink } from "../sharedComponents/ExternalLink";

function About() {
  const { t, userData } = use(RootContext);
  const pageTitle = `${t("title.about")} | ${t("title.app")}`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={t("meta.about")} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/about/`} />
        <meta property="og:url" content={`${SITE_URL}/about/`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={t("meta.about")} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={t("meta.about")} />
      </Helmet>

      <div className="w-full mx-auto px-2 sm:px-4 flex flex-col gap-12 py-10 text-(--text-primary)">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-center">
            {t("about.heading")}
          </h1>
          <p>{t("about.intro")}</p>
          <p>{t("about.summary")}</p>
          <p className="text-sm text-(--text-muted)">
            {t("about.openSource")}{" "}
            <ExternalLink
              href="https://github.com/goran1010/atlas-univerziteta"
              className="inline-flex items-center gap-1 align-middle"
            >
              <GitHubIcon size={14} />
              {t("about.github")}
            </ExternalLink>
            .
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center">
            {t("about.exploreHeading")}
          </h2>
          <p>{t("about.exploreDescription")}</p>
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <LinkButton to="/" className="w-full sm:w-auto">
              {t("about.exploreCta")}
            </LinkButton>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center">
            {t("about.improveHeading")}
          </h2>
          <p>{t("about.improveDescription")}</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>{t("about.improveStep1")}</li>
            <li>{t("about.improveStep2")}</li>
            <li>{t("about.improveStep3")}</li>
          </ol>
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {userData ? (
              <LinkButton to="/improve-data" className="w-full sm:w-auto">
                {t("about.improveContribute")}
              </LinkButton>
            ) : (
              <LinkButton to="/signup" className="w-full sm:w-auto">
                {t("about.improveSignUp")}
              </LinkButton>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold self-center">
            {t("about.forDevsHeading")}
          </h2>
          <p>{t("about.forDevsDescription")}</p>
          <p className="text-sm text-(--text-muted)">
            {t("about.forDevsNote")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <LinkButton to="/api-docs" className="w-full sm:w-auto">
              {t("about.forDevsCta")}
            </LinkButton>
            <ExternalLink
              href="https://github.com/goran1010/atlas-univerziteta"
              className="inline-flex items-center justify-center gap-1.5 font-semibold"
            >
              <GitHubIcon />
              {t("about.forDevsGithub")}
            </ExternalLink>
          </div>
        </section>
      </div>
    </>
  );
}

export { About };
