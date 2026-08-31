import type { ReactNode } from "react";

function ResultCard({ children }: { children: ReactNode }) {
  return (
    <li className="border border-(--border-color) rounded-lg p-3 bg-(--surface-2) hover:bg-(--hover-surface) transition-colors">
      {children}
    </li>
  );
}

export { ResultCard };
