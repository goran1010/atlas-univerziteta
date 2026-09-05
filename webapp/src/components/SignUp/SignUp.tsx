import { useState, useEffect, use } from "react";
import { useNavigate } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { Link } from "react-router";
import { SignUpForm } from "./SignUpForm";
import { GitHubLoginLink } from "../sharedComponents/GitHubLoginLink";
import { DividerOr } from "../sharedComponents/DividerOr";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../utils/envConfig";

function SignUp() {
  const [loading, setLoading] = useState(false);
  const { addNotification, t, userData } = use(RootContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (userData) {
      addNotification({
        type: "warning",
        message: t("auth.signup.blockedWhileLoggedIn"),
      });
      void navigate("/home");
    }
  }, [userData, navigate, addNotification, t]);

  return (
    <>
      <Helmet>
        <title>{`${t("title.signup")} | ${t("title.app")}`}</title>
        <meta name="description" content={t("meta.signup")} />
        <meta name="robots" content="index, follow" />
        <link
          rel="canonical"
          href={`${SITE_URL}/signup`}
        />
        <meta
          property="og:url"
          content={`${SITE_URL}/signup`}
        />
        <meta
          property="og:title"
          content={`${t("title.signup")} | ${t("title.app")}`}
        />
        <meta property="og:description" content={t("meta.signup")} />
        <meta
          name="twitter:title"
          content={`${t("title.signup")} | ${t("title.app")}`}
        />
        <meta name="twitter:description" content={t("meta.signup")} />
      </Helmet>
      <div className="relative min-h-full w-full max-w-xl mx-auto flex items-center justify-center p-4 sm:p-5 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
        <div className="w-full max-w-md p-1 sm:p-2 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl text-center font-bold">
              {t("auth.signup.heading")}
            </h1>
          </div>
          <SignUpForm setLoading={setLoading} loading={loading} />

          <DividerOr />

          <GitHubLoginLink setLoading={setLoading} loading={loading} />

          <DividerOr />

          <div className="relative">
            <p className="text-center">
              {t("auth.signup.haveAccountPrefix")}{" "}
              <Link className="hover:underline font-bold" to={"/login"}>
                {t("auth.login.linkText")}
              </Link>{" "}
              {t("auth.pageSuffix")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export { SignUp };
