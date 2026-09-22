import { Outlet } from "react-router";
import { Navbar } from "./components/Navbar/Navbar";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { useStatusCheck } from "./customHooks/useStatusCheck";
import { Notifications } from "./components/Notifications";
import { useNotification } from "./customHooks/useNotification";
import { useCloseMenu } from "./customHooks/useCloseMenu";
import { useLanguage } from "./customHooks/useLanguage";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { RootContext } from "./contextData/RootContext";
import { SkipNavbarLink } from "./components/SkipNavbarLink";
import { RouteAnnouncer } from "./components/RouteAnnouncer";
import { GithubLoginNotice } from "./components/GithubLoginNotice";
import { SITE_URL } from "./utils/envConfig";

function App() {
  const closeMenu = useCloseMenu();

  const { notifications, addNotification, removeNotification } =
    useNotification();
  const { language, setLanguage, t } = useLanguage();

  const { userData, setUserData } = useStatusCheck(addNotification, t);

  return (
    <RootContext
      value={{
        language,
        setLanguage,
        t,
        notifications,
        addNotification,
        removeNotification,
        userData,
        setUserData,
      }}
    >
      <HelmetProvider>
        <Helmet>
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Atlas Univerziteta" />
          <meta
            property="og:image"
            content={`${SITE_URL}/images/og-image-home.png`}
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:image"
            content={`${SITE_URL}/images/og-image-home.png`}
          />
        </Helmet>
        <>
          <ScrollToTop />

          {/* A11y: Accessibility features like route announcer and skip link */}
          <RouteAnnouncer />
          <GithubLoginNotice />
          <SkipNavbarLink t={t} />

          <Navbar closeMenu={closeMenu} />
          <Notifications />
          <main
            id="main-content"
            className="flex-1 flex flex-col items-center w-full max-w-[95ch] mx-auto p-2 md:px-5 relative bg-(--app-bg) text-(--text-primary)"
          >
            <Outlet />
          </main>
          <Footer />
        </>
      </HelmetProvider>
    </RootContext>
  );
}

export { App };
