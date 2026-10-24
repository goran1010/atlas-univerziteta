import { use } from "react";
import { Outlet } from "react-router";
import { Navbar } from "./components/Navbar/Navbar";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { useStatusCheck } from "./customHooks/useStatusCheck";
import { useOAuthLoginAnnouncement } from "./customHooks/useOAuthLoginAnnouncement";
import { Notifications } from "./components/Notifications";
import { useCloseMenu } from "./customHooks/useCloseMenu";
import { useLanguage } from "./customHooks/useLanguage";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { RootContext } from "./contextData/RootContext";
import { NotificationContext } from "./contextData/NotificationContext";
import { SkipNavbarLink } from "./components/SkipNavbarLink";
import { RouteAnnouncer } from "./components/RouteAnnouncer";
import { SITE_URL } from "./utils/envConfig";

function App() {
  const closeMenu = useCloseMenu();

  const { addNotification } = use(NotificationContext);
  const { language, setLanguage, t } = useLanguage();

  const { userData, setUserData } = useStatusCheck(addNotification, t);

  useOAuthLoginAnnouncement(addNotification, t);

  return (
    <RootContext
      value={{
        language,
        setLanguage,
        t,
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
            content={`${SITE_URL}/images/og-images/og-image-home.png`}
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:image"
            content={`${SITE_URL}/images/og-images/og-image-home.png`}
          />
        </Helmet>
        <>
          <ScrollToTop />

          {/* A11y: Accessibility features */}
          <RouteAnnouncer />
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
