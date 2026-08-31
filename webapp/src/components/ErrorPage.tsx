import { Link } from "react-router";
import { useLanguage } from "../customHooks/useLanguage";
import { Helmet } from "react-helmet-async";

function ErrorPage() {
  const { t } = useLanguage();
  console.warn("Page not found.");
  return (
    <>
      <Helmet>
        <title>{`${t("title.notFound")} | ${t("title.app")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main className="flex flex-col items-center gap-4 justify-center h-screen text-(--text-primary)">
        <h1 className="text-2xl font-normal text-(--text-primary)">
          {t("error.notFound")}
        </h1>
        <Link to="/" className="text-blue-500 underline text-2xl">
          {t("error.goHome")}
        </Link>
      </main>
    </>
  );
}
export { ErrorPage };
