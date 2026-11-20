import { Navigate, type RouteObject } from "react-router";
import { CreateServerPage } from "../features/servers/pages/CreateServerPage.tsx";
import { ServersListPage } from "../features/servers/pages/ServersListPage.tsx";
import { ConsoleShell } from "./layout/ConsoleShell.tsx";
import { NotFoundPage } from "./layout/NotFoundPage.tsx";
import { RouteError } from "./layout/RouteError.tsx";

/** Route table (docs/FRONTEND.md §3). */
export const routes: RouteObject[] = [
  {
    element: <ConsoleShell />,
    children: [
      {
        // Pathless route: a crash in one page shows an error panel inside the layout.
        errorElement: <RouteError />,
        children: [
          { index: true, element: <Navigate to="/servers" replace /> },
          { path: "servers", element: <ServersListPage /> },
          { path: "servers/new", element: <CreateServerPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
