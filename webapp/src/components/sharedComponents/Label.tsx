import type { LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

function Label({
  children,
  className = "",
  required = false,
  ...props
}: LabelProps) {
  const baseStyles = "block text-sm font-medium mb-1 text-(--text-secondary)";

  return (
    <label className={`${baseStyles} ${className}`} {...props}>
      {children}
      {/* the control's required attribute already announces this */}
      {required && <span aria-hidden="true"> *</span>}
    </label>
  );
}

export { Label };
