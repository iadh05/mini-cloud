import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { theme } from "../ui/theme.ts";

interface ProvidersProps {
  client: QueryClient;
  children: ReactNode;
}

/** Theme, notifications and the server-state cache. */
export function Providers({ client, children }: Readonly<ProvidersProps>) {
  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MantineProvider>
  );
}
