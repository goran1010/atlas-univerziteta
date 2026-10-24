import { useMemo } from "react";
import { useNotification } from "../customHooks/useNotification";
import {
  NotificationContext,
  NotificationListContext,
} from "./NotificationContext";

import type { ReactNode } from "react";

// Owns the toast state above the router, so adding a toast re-renders only
// this provider and the NotificationListContext consumers - not the app tree.
function NotificationProvider({ children }: { children: ReactNode }) {
  const { notifications, addNotification, removeNotification } =
    useNotification();

  const actions = useMemo(
    () => ({ addNotification, removeNotification }),
    [addNotification, removeNotification],
  );

  return (
    <NotificationContext value={actions}>
      <NotificationListContext value={notifications}>
        {children}
      </NotificationListContext>
    </NotificationContext>
  );
}

export { NotificationProvider };
