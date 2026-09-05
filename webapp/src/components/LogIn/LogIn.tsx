import { Link, useSearchParams } from "react-router";
import { useState, use, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { LogInForm } from "./LogInForm";
import { RootContext } from "../../contextData/RootContext";
import { GitHubLoginLink } from "../sharedComponents/GitHubLoginLink";
import { DividerOr } from "../sharedComponents/DividerOr";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../utils/envConfig";

function LogIn() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { t, addNotification, userData } = use(RootContext);

  useEffect(() => {
    if (searchParams.get("error") === "github") {
      addNotification({
        type: "error",
        message: t("auth.login.githubFailed"),
      });
    }
  }, [searchParams, addNotification, t]);

  const navigate = useNavigate();
  const wasLoggedInOnPageLoad = useRef(Boolean(userData));

  useEffect(() => {
    if (userData) {
      if (wasLoggedInOnPageLoad.current) {
        addNotification({
          type: "warning",
          message: t("auth.login.alreadyLoggedIn"),
        });
      }
      void navigate("/home");
      return;
    }
  }, [userData, navigate, addNotification, t]);

  return (
    <>
      <Helmet>
        <title>{`${t("title.login")} | ${t("title.app")}`}</title>
        <meta name="description" content={t("meta.login")} />
        <meta name="robots" content="index, follow" />
        <link
          rel="canonical"
          href={`${SITE_URL}/login`}
        />
        <meta
          property="og:url"
          content={`${SITE_URL}/login`}
        />
        <meta
          property="og:title"
          content={`${t("title.login")} | ${t("title.app")}`}
        />
        <meta property="og:description" content={t("meta.login")} />
        <meta
          name="twitter:title"
          content={`${t("title.login")} | ${t("title.app")}`}
        />
        <meta name="twitter:description" content={t("meta.login")} />
      </Helmet>
      <div className="relative min-h-full w-full max-w-xl mx-auto flex items-center justify-center p-4 sm:p-5 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
        <div className="w-full max-w-md p-1 sm:p-2 flex flex-col gap-4">
          <h1 className="text-3xl text-center font-bold">
            {t("auth.login.heading")}
          </h1>
          <LogInForm setLoading={setLoading} loading={loading} />
          <DividerOr />
          <GitHubLoginLink setLoading={setLoading} loading={loading} />
          <DividerOr />
          <div className="relative">
            <p className="text-center">
              {t("auth.login.noAccountPrefix")}{" "}
              <Link className="hover:underline font-bold" to={"/signup"}>
                {t("auth.signup.linkText")}
              </Link>{" "}
              {t("auth.pageSuffix")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export { LogIn };
