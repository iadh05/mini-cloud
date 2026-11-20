import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Providers } from "./app/providers.tsx";
import { createQueryClient } from "./app/query-client.ts";
import { routes } from "./app/routes.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

const router = createBrowserRouter(routes);

createRoot(root).render(
  <StrictMode>
    <Providers client={createQueryClient()}>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
