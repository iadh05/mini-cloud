import { MantineProvider } from "@mantine/core";
import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Providers } from "../src/app/providers.tsx";
import { routes } from "../src/app/routes.tsx";
import { theme } from "../src/ui/theme.ts";

/** Renders the whole console at a path, against the fake API. */
export function renderRoute(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  render(
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { user, router };
}

/** Renders one component with the theme only. */
export function renderUi(ui: ReactNode) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}
