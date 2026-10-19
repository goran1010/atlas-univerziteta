import { use, useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { RootContext } from "../../../src/contextData/RootContext";

function RootContextProbe() {
  const context = use(RootContext);

  // the default context functions must be safe no-ops; calling them in an
  // effect proves they neither throw nor change the rendered defaults
  useEffect(() => {
    context.setLanguage("sr");
    context.addNotification({ type: "info", message: "Default" });
    context.removeNotification("notification-id");
    context.setUserData(null);
  }, [context]);

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
