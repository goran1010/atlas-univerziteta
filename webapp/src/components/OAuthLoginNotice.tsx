import { use, useEffect } from "react";
import { useSearchParams } from "react-router";
import { RootContext } from "../contextData/RootContext";

const LOGIN_SUCCESS_MESSAGES: Record<string, string> = {
  github: "messages.auth.githubLoginSuccess",
  google: "messages.auth.googleLoginSuccess",
};

function OAuthLoginNotice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, addNotification } = use(RootContext);

  useEffect(() => {
    const provider = searchParams.get("login");
    const messageKey = provider ? LOGIN_SUCCESS_MESSAGES[provider] : undefined;
    if (!messageKey) return;

    addNotification({ type: "success", message: t(messageKey) });
    const next = new URLSearchParams(searchParams);
    next.delete("login");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, addNotification, t]);

  return null;
}

export { OAuthLoginNotice };
