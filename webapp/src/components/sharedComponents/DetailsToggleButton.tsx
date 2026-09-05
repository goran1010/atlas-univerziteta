import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Button } from "./Button";

interface DetailsToggleButtonProps {
  expanded: boolean;
  onClick: () => void;
  loading?: boolean;
  className?: string;
}

function DetailsToggleButton({
  expanded,
  onClick,
  loading,
  className,
}: DetailsToggleButtonProps) {
  const { t } = use(RootContext);

  return (
    <Button
      variant="secondary"
      className={className}
      onClick={onClick}
      loading={loading}
      aria-expanded={expanded}
    >
      <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>{" "}
      {expanded
        ? t("universitiesPage.collapse")
        : t("universitiesPage.expand")}
    </Button>
  );
}

export { DetailsToggleButton };
