import type { ReactNode } from "react";

function ResultCard({ children }: { children: ReactNode }) {
  return (
    <li className="border border-(--border-color) rounded-lg overflow-hidden bg-(--surface-2) hover:bg-(--hover-surface) transition-colors">
      <div className="p-2 sm:p-4">{children}</div>
    </li>
  );
}

export { ResultCard };
