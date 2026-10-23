import { createContext } from "react";

import type {
  AddNotification,
  Notification,
  RemoveNotification,
} from "../types";

// Two contexts so a toast only re-renders its consumers: the actions are
// stable callbacks (consumers of addNotification never re-render on toast
// changes), while the list changes with every toast and is consumed only by
// the Notifications component.
interface NotificationContextType {
  addNotification: AddNotification;
  removeNotification: RemoveNotification;
}

const NotificationContext = createContext<NotificationContextType>({
  addNotification: (prop) => prop,
  removeNotification: (prop) => prop,
});

const NotificationListContext = createContext<Notification[]>([]);

export { NotificationContext, NotificationListContext };
export type { NotificationContextType };
