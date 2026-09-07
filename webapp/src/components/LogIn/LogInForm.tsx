import {
  checkLoginFieldValidity,
  checkLoginFormValidity,
} from "./utils/loginValidation";
import { useRef, useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { useNavigate } from "react-router";
import { handleSubmitLogIn } from "./utils/handleSubmitLogIn";
import { Button } from "../sharedComponents/Button";
import { Input } from "../sharedComponents/Input";
import { Label } from "../sharedComponents/Label";
import { SERVER_STATUS } from "../../utils/serverStatus";

import type { ChangeEvent } from "react";
interface LogInFormProps {
  disabled: boolean;
  onLoadingChange: (loading: boolean) => void;
}

function LogInForm({ disabled, onLoadingChange }: LogInFormProps) {
  const navigate = useNavigate();
  const { setUserData, addNotification, t, serverStatus } = use(RootContext);
  const [loading, setLoading] = useState(false);

  function handleSetLoading(value: boolean) {
    setLoading(value);
    onLoadingChange(value);
  }

  const ctx = {
    addNotification,
    setLoading: handleSetLoading,
    t,
    serverStatus,
  };

  const [inputFields, setInputFields] = useState({
    email: "",
    password: "",
  });

  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);

  function handleInputFields(e: ChangeEvent<HTMLInputElement>) {
    checkLoginFieldValidity(
      e.target.name,
      emailInput.current,
      passwordInput.current,
      t,
    );
    setInputFields({ ...inputFields, [e.target.name]: e.target.value });
  }

  return (
    <form
      onSubmit={(e) =>
        void handleSubmitLogIn(e, inputFields, setUserData, navigate, ctx)
      }
      className="flex flex-col gap-3"
    >
      <p className="text-xs text-(--text-muted)">{t("form.requiredHint")}</p>
      <div>
        <Label htmlFor="email" required>
          {t("form.email")}
        </Label>
        <Input
          value={inputFields.email}
          ref={emailInput}
          onChange={handleInputFields}
          type="email"
          name="email"
          id="email"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <Label htmlFor="password" required>
          {t("form.password")}
        </Label>
        <Input
          ref={passwordInput}
          value={inputFields.password}
          onChange={handleInputFields}
          type="password"
          name="password"
          id="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div>
        <Button
          variant="success"
          onClick={() => {
            checkLoginFormValidity(
              emailInput.current,
              passwordInput.current,
              t,
            );
          }}
          type="submit"
          loading={loading}
          disabled={disabled || serverStatus !== SERVER_STATUS.LIVE}
        >
          {t("auth.login.heading")}
        </Button>
      </div>
    </form>
  );
}

export { LogInForm };
