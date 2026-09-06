import { useEffect } from "react";
import { Link } from "react-router";
import { useLanguage } from "../customHooks/useLanguage";
import { Helmet, HelmetProvider } from "react-helmet-async";

function useApplyTheme() {
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isDark = saved === "dark" || (saved !== "light" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
}

function ErrorPage() {
  const { t } = useLanguage();
  useApplyTheme();
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
          <Link
            to="/"
            className="border rounded-lg px-4 py-2 transition-colors font-medium text-(--text-primary) hover:bg-(--hover-surface) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
          >
            {t("error.goHome")}
          </Link>
        </section>
      </main>
    </HelmetProvider>
  );
}
export { ErrorPage };
