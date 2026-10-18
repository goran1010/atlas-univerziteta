import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { RootContextProvider } from "./rootContextProvider";

import type { ReactNode } from "react";
import type { RootContextType } from "../../src/contextData/RootContext";
import type { UserData } from "../../src/types";

interface RenderWithProvidersOptions {
  route?: string;
  path?: string;
  userData?: UserData;
  rootValue?: Partial<RootContextType>;
}

function renderWithProviders(
  ui: ReactNode,
  {
    route = "/",
    path = "*",
    userData = null,
    rootValue,
  }: RenderWithProvidersOptions = {},
) {
  const router = createMemoryRouter([{ path, element: ui }], {
    initialEntries: [route],
  });

  return {
    user: userEvent.setup(),
    ...render(
      <RootContextProvider initialUserData={userData} rootValue={rootValue}>
        <RouterProvider router={router} />
      </RootContextProvider>,
    ),
  };
}

export { renderWithProviders };
