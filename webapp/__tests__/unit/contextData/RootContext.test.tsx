import { use } from "react";
import { render, screen } from "@testing-library/react";
import { RootContext } from "../../../src/contextData/RootContext";

function RootContextProbe() {
  const context = use(RootContext);
  const notification = { type: "info" as const, message: "Default" };

  context.setLanguage("sr");
  context.addNotification(notification);
  context.removeNotification("notification-id");
  context.setUserData(null);

  return (
    <div>
      <output data-testid="language">{context.language}</output>
      <output data-testid="translation">{context.t("test.key")}</output>
      <output data-testid="notification-count">
        {context.notifications.length}
      </output>
      <output data-testid="user">
        {context.userData ? context.userData.email : "null"}
      </output>
    </div>
  );
}

describe("RootContext", () => {
  test("provides usable defaults without a provider", () => {
    render(<RootContextProbe />);

    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(screen.getByTestId("translation")).toHaveTextContent("test.key");
    expect(screen.getByTestId("notification-count")).toHaveTextContent("0");
    expect(screen.getByTestId("user")).toHaveTextContent("null");
  });
});
