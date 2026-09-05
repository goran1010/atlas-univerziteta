import { use, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../utils/envConfig";
import { SearchIcon, ListIcon } from "../sharedComponents/icons";

const TABS: { key: string; to: string; icon: ReactNode }[] = [
  { key: "search", to: "/search", icon: <SearchIcon size={14} /> },
  { key: "browseAll", to: "/browse", icon: <ListIcon size={14} /> },
];

function Universities() {
  const { t } = use(RootContext);

  return (
    <>
      <Helmet>
        <title>{`${t("title.universities")} | ${t("title.app")}`}</title>
        <meta name="description" content={t("meta.universities")} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta
          property="og:url"
          content={`${SITE_URL}/`}
        />
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
        <div className="flex gap-1 justify-center border-b border-(--border-color)">
          {TABS.map((tab) => (
            <NavLink
              key={tab.key}
              to={tab.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md transition-colors cursor-pointer ${
                  isActive
                    ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "text-(--text-secondary) hover:text-(--text-primary)"
                }`
              }
            >
              {tab.icon}
              {t(`universitiesPage.${tab.key}`)}
            </NavLink>
          ))}
        </div>

        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export { Universities };
