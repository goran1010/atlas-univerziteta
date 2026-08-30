export type TypeNotification = "success" | "error" | "info" | "warning";

export interface Notification {
  id?: string;
  type: TypeNotification;
  message: string;
  duration?: number | null;
  persistent?: boolean;
}

export type AddNotification = (notification: Notification) => void;
export type RemoveNotification = (id: string | undefined) => void;
