import { useRef, useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { handleForgotPasswordSubmit } from "./utils/handleForgotPasswordSubmit";
import { emailSchema } from "../../schemas/auth";
import { applyValidity } from "../../utils/formValidation";
import { Button } from "../sharedComponents/Button";
import { Input } from "../sharedComponents/Input";
import { Label } from "../sharedComponents/Label";
import { LinkButton } from "../sharedComponents/LinkButton";
import { TextLink } from "../sharedComponents/TextLink";
import { Helmet } from "react-helmet-async";

import type { ChangeEvent } from "react";

function ForgotPassword() {
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const emailInput = useRef<HTMLInputElement>(null);

  const ctx = { addNotification, setLoading, t };

  function checkEmailValidity() {
    if (emailInput.current === null) return;
    const key = emailSchema.safeParse(emailInput.current.value).success
      ? null
      : "validation.email.invalid";
    applyValidity(emailInput.current, key, t);
  }

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    checkEmailValidity();
    setEmail(e.target.value);
  }

  return (
    <>
      <Helmet>
        <title>{`${t("title.forgotPassword")} | ${t("title.app")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="relative min-h-full w-full max-w-xl mx-auto flex items-center justify-center p-4 sm:p-5 bg-(--surface-2) text-(--text-primary) border border-(--border-color) rounded-2xl shadow-(--card-shadow) backdrop-blur-sm">
        <div className="w-full max-w-md p-1 sm:p-2 flex flex-col gap-4">
          <h1 className="text-3xl text-center font-bold">
            {t("auth.forgotPassword.heading")}
          </h1>
          {sent ? (
            <>
              <p className="text-center">{t("auth.forgotPassword.sent")}</p>
              <LinkButton to="/login" className="w-full sm:w-auto self-center">
                {t("auth.forgotPassword.backToLogin")}
              </LinkButton>
            </>
          ) : (
            <>
              <p className="text-center text-(--text-secondary)">
                {t("auth.forgotPassword.description")}
              </p>
              <form
                onSubmit={(e) =>
                  void handleForgotPasswordSubmit(
                    e,
                    email,
                    () => {
                      setSent(true);
                    },
                    ctx,
                  )
                }
                className="flex flex-col gap-3"
              >
                <div>
                  <Label htmlFor="email" required>
                    {t("form.email")}
                  </Label>
                  <Input
                    ref={emailInput}
                    value={email}
                    onChange={handleEmailChange}
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <Button
                  className="w-full"
                  variant="success"
                  onClick={checkEmailValidity}
                  type="submit"
                  loading={loading}
                >
                  {t("auth.forgotPassword.submit")}
                </Button>
              </form>
              <TextLink to="/login" className="self-center text-sm">
                {t("auth.forgotPassword.backToLogin")}
              </TextLink>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export { ForgotPassword };
