import type { ReactNode } from "react";

function DetailPageStatus({
  message,
  action,
}: {
  message: string;
  action: ReactNode;
}) {
  return (
    <div className="w-full mx-auto px-1 sm:px-4 py-8 text-center">
      <p className="text-(--text-muted) text-lg">{message}</p>
      {action}
    </div>
  );
}

export { DetailPageStatus };
