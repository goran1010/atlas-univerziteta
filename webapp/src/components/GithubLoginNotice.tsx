import { use, useEffect } from "react";
import { useSearchParams } from "react-router";
import { RootContext } from "../contextData/RootContext";

// the GitHub OAuth callback redirects here with ?login=github; show the
// success notification once and strip the marker from the URL
function GithubLoginNotice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, addNotification } = use(RootContext);

  useEffect(() => {
    if (searchParams.get("login") !== "github") return;
    addNotification({
      type: "success",
      message: t("messages.auth.githubLoginSuccess"),
    });
    const next = new URLSearchParams(searchParams);
    next.delete("login");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, addNotification, t]);

  return null;
}

export { GithubLoginNotice };
