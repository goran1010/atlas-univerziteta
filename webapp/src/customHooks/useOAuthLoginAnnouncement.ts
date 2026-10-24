import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

import type { AddNotification, TFunction } from "../types";

// OAuth logins return via a full-page redirect, so no toast can survive from
// the login page. The provider sends the browser back to this URL on success
// and the hook below turns the one-shot marker into the notification.
function oauthLoginCallbackUrl() {
  return `${window.location.origin}/?login=success`;
}

function useOAuthLoginAnnouncement(
  addNotification: AddNotification,
  t: TFunction,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const announced = useRef(false);

  useEffect(() => {
    if (searchParams.get("login") !== "success" || announced.current) {
      return;
    }
    announced.current = true;
    const next = new URLSearchParams(searchParams);
    next.delete("login");
    setSearchParams(next, { replace: true });
    addNotification({
      type: "success",
      message: t("messages.auth.loginSuccess"),
    });
  }, [searchParams, setSearchParams, addNotification, t]);
}

export { oauthLoginCallbackUrl, useOAuthLoginAnnouncement };
