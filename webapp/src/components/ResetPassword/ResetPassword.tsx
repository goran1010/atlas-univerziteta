import { useRef, useState, use } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { handleResetPasswordSubmit } from "./utils/handleResetPasswordSubmit";
import {
  checkResetPasswordFieldValidity,
  checkResetPasswordFormValidity,
} from "./utils/resetPasswordValidation";
import { Button } from "../sharedComponents/Button";
import { Input } from "../sharedComponents/Input";
import { Label } from "../sharedComponents/Label";
import { LinkButton } from "../sharedComponents/LinkButton";
import { Helmet } from "react-helmet-async";

import type { ChangeEvent } from "react";

function ResetPassword() {
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [tokenRejected, setTokenRejected] = useState(false);

  // the emailed link goes through the server, which redirects here with
  // ?token= when it is valid and ?error=INVALID_TOKEN when it is not
  const token = searchParams.get("token");

  const ctx = { addNotification, setLoading, t };

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const [inputFields, setInputFields] = useState({
    password: "",
    ["confirm-password"]: "",
  });

  function handleInputFields(e: ChangeEvent<HTMLInputElement>) {
    checkResetPasswordFieldValidity(
      e.target.name,
      passwordRef.current,
      confirmPasswordRef.current,
      t,
    );
    setInputFields({ ...inputFields, [e.target.name]: e.target.value });
  }

  return (
    <>
      <Helmet>
        <title>{`${t("title.resetPassword")} | ${t("title.app")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="relative min-h-full w-full max-w-xl mx-auto flex items-center justify-center p-4 sm:p-5 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
        <div className="w-full max-w-md p-1 sm:p-2 flex flex-col gap-4">
          {!token || tokenRejected ? (
            <>
              <h1 className="text-3xl text-center font-bold">
                {t("auth.resetPassword.invalidHeading")}
              </h1>
              <p className="text-center text-(--text-secondary)">
                {t("auth.resetPassword.invalidDescription")}
              </p>
              <LinkButton
                to="/forgot-password"
                className="w-full sm:w-auto self-center"
              >
                {t("auth.resetPassword.requestNew")}
              </LinkButton>
            </>
          ) : (
            <>
              <h1 className="text-3xl text-center font-bold">
                {t("auth.resetPassword.heading")}
              </h1>
              <form
                onSubmit={(e) =>
                  void handleResetPasswordSubmit(
                    e,
                    inputFields.password,
                    token,
                    () => void navigate("/login"),
                    () => {
                      setTokenRejected(true);
                    },
                    ctx,
                  )
                }
                className="flex flex-col gap-3"
              >
                <div>
                  <Label htmlFor="password" required>
                    {t("form.password")}
                  </Label>
                  <Input
                    ref={passwordRef}
                    value={inputFields.password}
                    onChange={handleInputFields}
                    type="password"
                    name="password"
                    id="password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password" required>
                    {t("form.confirmPassword")}
                  </Label>
                  <Input
                    ref={confirmPasswordRef}
                    value={inputFields["confirm-password"]}
                    onChange={handleInputFields}
                    type="password"
                    name="confirm-password"
                    id="confirm-password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Button
                  className="w-full"
                  variant="success"
                  onClick={() => {
                    checkResetPasswordFormValidity(
                      passwordRef.current,
                      confirmPasswordRef.current,
                      t,
                    );
                  }}
                  type="submit"
                  loading={loading}
                >
                  {t("auth.resetPassword.submit")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export { ResetPassword };
