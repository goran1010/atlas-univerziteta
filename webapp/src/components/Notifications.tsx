import { XIcon } from "./sharedComponents/icons";
import { use, useEffect, useRef } from "react";
import { RootContext } from "../contextData/RootContext";
import type { TypeNotification } from "../types/notification";

function getNotificationStyles(type: TypeNotification) {
  switch (type) {
    case "success":
      return "border-l-green-600 dark:border-l-green-400";
    case "error":
      return "border-l-red-600 dark:border-l-red-400";
    case "warning":
      return "border-l-amber-500 dark:border-l-amber-400";
    case "info":
    default:
      return "border-l-sky-600 dark:border-l-sky-400";
  }
}

function getNotificationRole(type: TypeNotification) {
  if (type === "error" || type === "warning") {
    return "alert";
  }
  return "status";
}

function Notifications() {
  const { notifications, removeNotification, t } = use(RootContext);
  const timerMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const timers = timerMapRef.current;
    const currentNotificationIds = new Set<string>();

    notifications.forEach((notification) => {
      const notificationId = notification.id;

      if (!notificationId) {
        return;
      }

      currentNotificationIds.add(notificationId);

      const shouldAutoDismiss =
        !notification.persistent &&
        typeof notification.duration === "number" &&
        notification.duration > 0;

      if (!shouldAutoDismiss) {
        const existingTimer = timers.get(notificationId);

        if (existingTimer !== undefined) {
          clearTimeout(existingTimer);
          timers.delete(notificationId);
        }

        return;
      }

      if (!timers.has(notificationId)) {
        const timer = setTimeout(() => {
          removeNotification(notificationId);
          timers.delete(notificationId);
        }, notification.duration ?? undefined);

        timers.set(notificationId, timer);
      }
    });

    // Uses notifications from the current render.
    timers.forEach((timer, id) => {
      if (!currentNotificationIds.has(id)) {
        clearTimeout(timer);
        timers.delete(id);
      }
    });
  }, [notifications, removeNotification]);

  useEffect(() => {
    const timers = timerMapRef.current;

    return () => {
      timers.forEach((timer) => {
        clearTimeout(timer);
      });

      timers.clear();
    };
  }, []);

  if (!notifications.length) return null;

  return (
    <aside
      className="fixed top-18 right-4 z-20 w-[min(92vw,24rem)] select-none opacity-90 hover:opacity-100 transition-opacity"
      aria-label={t("notifications.title")}
      aria-live="polite"
      aria-relevant="additions text"
    >
      <ul className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <li key={notification.id} className="w-full">
            <div
              role={getNotificationRole(notification.type)}
              aria-atomic="true"
              className={`relative px-4 py-3 rounded-lg w-full flex flex-col justify-center items-center bg-white/65 dark:bg-slate-900/65 text-(--text-primary) border border-(--border-color) border-l-4 shadow-(--card-shadow) backdrop-blur ${getNotificationStyles(
                notification.type,
              )}`}
            >
              <p>{notification.message}</p>

              <button
                type="button"
                onClick={() => {
                  removeNotification(notification.id);
                }}
                aria-label={t("notifications.dismiss")}
                className="absolute top-0 right-1 text-sm font-semibold text-current cursor-pointer transition-transform active:scale-90"
              >
                <XIcon />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export { Notifications };
