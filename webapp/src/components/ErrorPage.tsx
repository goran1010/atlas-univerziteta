import { LinkButton } from "./sharedComponents/LinkButton";
import { useLanguage } from "../customHooks/useLanguage";
import { Helmet, HelmetProvider } from "react-helmet-async";

function ErrorPage() {
  const { t } = useLanguage();
  console.warn("Page not found.");
  return (
    <HelmetProvider>
      <Helmet>
        <title>{`${t("title.notFound")} | ${t("title.app")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main className="flex flex-col items-center gap-4 justify-center h-screen p-3 bg-(--app-bg)">
        <section className="w-full max-w-md flex flex-col items-center gap-4 p-6 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
          <p className="text-6xl font-bold text-(--text-muted)">404</p>
          <h1 className="text-center text-(--text-secondary)">
            {t("error.notFound")}
          </h1>
          <LinkButton to="/">{t("error.goHome")}</LinkButton>
        </section>
      </main>
    </HelmetProvider>
  );
}
export { ErrorPage };
