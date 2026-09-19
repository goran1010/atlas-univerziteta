import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

// Announces the new page title to screen readers after client-side
// navigation - SPAs get no automatic announcement on route change.
function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [announcement, setAnnouncement] = useState("");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Helmet applies the new document.title shortly after render.
    const timer = setTimeout(() => {
      setAnnouncement(document.title);
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <p className="sr-only" aria-live="polite">
      {announcement}
    </p>
  );
}

export { RouteAnnouncer };
