import type { SystemLanguage } from "../utils/setInitialLanguage";

export type UserData = {
  email: string;
  role: "ADMIN" | "USER";
  adminRequestedAt?: string | null;
} | null;

export type Language = SystemLanguage | "system";
export type SetLanguage = (language: Language) => void;
export type TFunction = (key: string) => string;

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
