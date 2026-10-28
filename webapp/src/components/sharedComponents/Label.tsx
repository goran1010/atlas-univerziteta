import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import type { LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
  required?: boolean | undefined;
}

function Label({
  children,
  className = "",
  required = false,
  ...props
}: LabelProps) {
  const { t } = use(RootContext);
  const baseStyles = "block text-sm font-medium mb-1 text-(--text-secondary)";

  return (
    <label className={`${baseStyles} ${className}`} {...props}>
      {children}
      {/* the control's required attribute already announces this */}
      {required && (
        <span
          aria-hidden="true"
          className="relative -top-1 ml-1.5 inline-block px-1.5 py-px rounded-full text-[9px] leading-snug font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
        >
          {t("form.required")}
        </span>
      )}
    </label>
  );
}

export { Label };
