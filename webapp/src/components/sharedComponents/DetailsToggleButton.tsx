import { ChevronDownIcon } from "./icons";
import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Button } from "./Button";

interface DetailsToggleButtonProps {
  expanded: boolean;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

function DetailsToggleButton({
  expanded,
  onClick,
  loading,
  disabled,
  className,
}: DetailsToggleButtonProps) {
  const { t } = use(RootContext);

  return (
    <Button
      variant="ghost"
      className={className}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      aria-expanded={expanded}
    >
      <ChevronDownIcon
        className={`transition-transform ${expanded ? "rotate-180" : ""}`}
      />{" "}
      {expanded ? t("universitiesPage.collapse") : t("universitiesPage.expand")}
    </Button>
  );
}

export { DetailsToggleButton };
