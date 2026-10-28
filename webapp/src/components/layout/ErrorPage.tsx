import { isRouteErrorResponse, useRouteError } from "react-router";
import { LinkButton } from "../sharedComponents/LinkButton";
import { Button } from "../sharedComponents/Button";
import { useLanguage } from "../../customHooks/useLanguage";
import { Helmet, HelmetProvider } from "react-helmet-async";

// The root errorElement catches unmatched routes (404) and anything thrown
// during render, loading, or a lazy chunk load - present them differently.
function ErrorPage() {
  const { t } = useLanguage();
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  if (isNotFound) {
    console.warn("Page not found.");
  } else {
    console.error(error);
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{`${t(isNotFound ? "title.notFound" : "title.error")} | ${t("title.app")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main className="flex flex-col items-center gap-4 justify-center h-screen p-3 bg-(--app-bg)">
        <section className="w-full max-w-md flex flex-col items-center gap-4 p-6 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
          {isNotFound && (
            <p className="text-6xl font-bold text-(--text-muted)">404</p>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-center text-(--text-secondary)">
            {t(isNotFound ? "error.notFound" : "error.generic")}
          </h1>
          <div className="flex w-full flex-wrap gap-3 justify-center">
            {!isNotFound && (
              <Button
                variant="secondary"
                className="flex-1 sm:flex-initial"
                onClick={() => {
                  window.location.reload();
                }}
              >
                {t("error.reload")}
              </Button>
            )}
            <LinkButton to="/" className="flex-1 sm:flex-initial">
              {t("error.goHome")}
            </LinkButton>
          </div>
        </section>
      </main>
    </HelmetProvider>
  );
}
export { ErrorPage };
