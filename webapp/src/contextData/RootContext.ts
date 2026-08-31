import { createContext } from "react";

import type { Dispatch, SetStateAction } from "react";
import type { UserData } from "../types/auth";
import type { Language, SetLanguage, TFunction } from "../types/i18n";
import type {
  AddNotification,
  Notification,
  RemoveNotification,
} from "../types/notification";
import type { ServerStatus } from "../utils/serverStatus";

interface RootContextType {
  language: Language;
  setLanguage: SetLanguage;
  t: TFunction;
  notifications: Notification[];
  addNotification: AddNotification;
  removeNotification: RemoveNotification;
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  serverStatus: ServerStatus;
}

const RootContext = createContext<RootContextType>({
  language: "en",
  setLanguage: (prop) => prop,
  t: (prop) => prop,
  notifications: [],
  addNotification: (prop) => prop,
  removeNotification: (prop) => prop,
  userData: null,
  setUserData: (prop) => prop,
  serverStatus: "live",
});

export { RootContext };
export type { RootContextType };
