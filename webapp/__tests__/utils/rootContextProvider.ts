import { createElement, type ReactNode, useState } from "react";
import { RootContext } from "../../src/contextData/RootContext";
import {
  NotificationContext,
  NotificationListContext,
} from "../../src/contextData/NotificationContext";
import type { RootContextType } from "../../src/contextData/RootContext";
import type { NotificationContextType } from "../../src/contextData/NotificationContext";
import { useLanguage } from "../../src/customHooks/useLanguage";
import { useNotification } from "../../src/customHooks/useNotification";
import type { Notification, UserData } from "../../src/types";

// rootValue accepts notification overrides too, so tests can keep injecting
// addNotification mocks the way they did when RootContext carried them.
type ProviderOverrides = Partial<
  RootContextType & NotificationContextType & { notifications: Notification[] }
>;

interface RootContextProviderProps {
  children: ReactNode;
  initialUserData?: UserData;
  rootValue?: ProviderOverrides | undefined;
}

function RootContextProvider({
  children,
  initialUserData = null,
  rootValue = {},
}: RootContextProviderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [userData, setUserData] = useState(initialUserData);
  const { notifications, addNotification, removeNotification } =
    useNotification();

  const {
    addNotification: addOverride,
    removeNotification: removeOverride,
    notifications: listOverride,
    ...rootOverrides
  } = rootValue;

  const value: RootContextType = {
    language,
    setLanguage,
    t,
    userData,
    setUserData,
    ...rootOverrides,
  };

  const actions: NotificationContextType = {
    addNotification: addOverride ?? addNotification,
    removeNotification: removeOverride ?? removeNotification,
  };

  return createElement(
    RootContext,
    { value },
    createElement(
      NotificationContext,
      { value: actions },
      createElement(
        NotificationListContext,
        { value: listOverride ?? notifications },
        children,
      ),
    ),
  );
}

export { RootContextProvider };
export type { ProviderOverrides };
