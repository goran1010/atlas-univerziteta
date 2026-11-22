import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { TextLink } from "../sharedComponents/TextLink";

function ImproveDataLink() {
  const { userData, t } = use(RootContext);

  return (
    <p className="text-sm text-(--text-muted) mt-2">
      {t("universitiesPage.improvePrompt")}{" "}
      {userData ? (
        <TextLink to="/improve-data/add">
          {t("universitiesPage.improveLink")}
        </TextLink>
      ) : (
        <TextLink to="/login">{t("universitiesPage.improveLogin")}</TextLink>
      )}
    </p>
  );
}

export { ImproveDataLink };
