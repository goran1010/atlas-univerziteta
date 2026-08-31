import { Outlet } from "react-router";
import { Navbar } from "./components/Navbar/Navbar";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { useStatusCheck } from "./customHooks/useStatusCheck";
import { Notifications } from "./components/Notifications";
import { useNotification } from "./customHooks/useNotification";
import { useServerWakeUp } from "./customHooks/useServerWakeUp";
import { useCloseMenu } from "./customHooks/useCloseMenu";
import { useLanguage } from "./customHooks/useLanguage";
import { HelmetProvider } from "react-helmet-async";
import { RootContext } from "./contextData/RootContext";
import { SkipNavbarLink } from "./components/utils/SkipNavbarLink";
import { RouteAnnouncer } from "./components/utils/RouteAnnouncer";

function App() {
  const closeMenu = useCloseMenu();

  const { notifications, addNotification, removeNotification } =
    useNotification();
  const { language, setLanguage, t } = useLanguage();
  const serverStatus = useServerWakeUp({
    addNotification,
    removeNotification,
    t,
  });

  const { userData, setUserData } = useStatusCheck(
    addNotification,
    t,
    serverStatus,
  );

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
        serverStatus,
      }}
    >
      <HelmetProvider>
        <>
          <ScrollToTop />
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
