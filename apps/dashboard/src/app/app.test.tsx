import { RESOURCE_STATUSES } from "@mini-cloud/shared";
import { screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { renderRoute, renderUi } from "../../test/render.tsx";
import { StatusBadge } from "../ui/molecules/StatusBadge.tsx";
import { navGroups } from "./layout/ConsoleShell.tsx";
import { RouteError } from "./layout/RouteError.tsx";

describe("console shell", () => {
  it("builds the navigation from the service catalog", () => {
    expect(navGroups("/servers/new")).toEqual([
      { label: "Compute", items: [{ label: "Servers", href: "/servers", active: true }] },
    ]);
  });

  it("shows a not found page for unknown paths", async () => {
    renderRoute("/nope");
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeTruthy();
  });

  it("opens the navigation on small screens", async () => {
    const { user } = renderRoute("/nope");
    // Hidden by CSS on wide screens, so role queries skip it; find it by its label.
    await user.click(await screen.findByLabelText("Open navigation"));
    expect(screen.getByLabelText("Close navigation")).toBeTruthy();
  });

  it("shows a crash inside the page instead of a blank screen", async () => {
    // React logs the crash on purpose; keep the test output clean.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    function Broken(): never {
      throw new Error("render failed");
    }
    const router = createMemoryRouter([
      { path: "/", element: <Broken />, errorElement: <RouteError /> },
    ]);
    renderUi(<RouterProvider router={router} />);
    expect(await screen.findByText("This page crashed")).toBeTruthy();
    expect(screen.getByText("render failed")).toBeTruthy();
    consoleError.mockRestore();
  });
});

describe("StatusBadge", () => {
  it("always shows the status as text", () => {
    renderUi(
      <>
        {RESOURCE_STATUSES.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </>,
    );
    for (const label of ["Pending", "Provisioning", "Running", "Stopped", "Failed"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
});
