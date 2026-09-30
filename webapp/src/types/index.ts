import type { SystemLanguage } from "../utils/setInitialLanguage";

export type UserData = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string;
  adminRequestedAt?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
