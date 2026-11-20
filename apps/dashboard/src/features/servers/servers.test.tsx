import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { aPage, aServer, anError, api } from "../../../test/api.ts";
import { renderRoute } from "../../../test/render.tsx";
import { ApiError } from "../../api/errors.ts";
import { fieldErrorsFrom } from "./components/CreateServerForm.tsx";
import { POLL_MS } from "./api.ts";

const LIST = "/v1/servers";

describe("servers list", () => {
  it("shows the empty state with a way to create the first server", async () => {
    api.use(http.get(LIST, () => aPage([])));
    renderRoute("/servers");

    expect(await screen.findByRole("heading", { name: "No servers yet" })).toBeTruthy();
    const links = screen.getAllByRole("link", { name: "Create server" });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/servers/new",
      "/servers/new",
    ]);
  });

  it("shows status, URL and the error of failed servers", async () => {
    api.use(
      http.get(LIST, () =>
        aPage([
          aServer({ name: "web-1" }),
          aServer({ name: "shop", status: "pending", outputs: {} }),
          aServer({
            name: "old-demo",
            status: "failed",
            outputs: {},
            error: "The server spec is invalid: Image must be one of: nginx, httpd, caddy, whoami",
          }),
        ]),
      ),
    );
    renderRoute("/servers");

    const link = await screen.findByRole("link", { name: "web-1.mc.localhost" });
    expect(link.getAttribute("href")).toBe("http://web-1.mc.localhost");
    expect(link.getAttribute("target")).toBe("_blank");

    const shop = screen.getByRole("row", { name: /shop/ });
    expect(within(shop).getByText("Pending")).toBeTruthy();
    expect(within(shop).getByText("Waiting for a worker")).toBeTruthy();
    expect(within(shop).getByText("Ready soon")).toBeTruthy();

    const failed = screen.getByRole("row", { name: /old-demo/ });
    expect(within(failed).getByText("Failed")).toBeTruthy();
    expect(within(failed).getByText(/Image must be one of/)).toBeTruthy();
    expect(within(failed).getByText("—")).toBeTruthy();
  });

  it("says when only the newest servers are shown", async () => {
    api.use(http.get(LIST, () => aPage([aServer()], "0193a6f2-0000-7000-8000-000000000999")));
    renderRoute("/servers");
    expect(await screen.findByText("Showing the 100 newest servers.")).toBeTruthy();
  });

  it(
    "updates provisioning → running by itself, then stops polling",
    async () => {
      let calls = 0;
      api.use(
        http.get(LIST, () => {
          calls += 1;
          const server =
            calls === 1
              ? aServer({ name: "web-1", status: "provisioning", outputs: {} })
              : aServer({ name: "web-1" });
          return aPage([server]);
        }),
      );
      renderRoute("/servers");

      const row = await screen.findByRole("row", { name: /web-1/ });
      expect(within(row).getByText("Provisioning")).toBeTruthy();
      expect(within(row).getByText("Terraform is creating it")).toBeTruthy();
      await screen.findByRole("link", { name: "web-1.mc.localhost" }, { timeout: POLL_MS * 2 });

      const callsWhenSettled = calls;
      await new Promise((resolve) => setTimeout(resolve, POLL_MS + 500));
      expect(calls).toBe(callsWhenSettled);
    },
    POLL_MS * 5,
  );

  it("shows a load error with the request id and can try again", async () => {
    let fail = true;
    api.use(
      http.get(LIST, () =>
        fail ? anError(500, "internal", "Something went wrong on our side") : aPage([aServer()]),
      ),
    );
    const { user } = renderRoute("/servers");

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Something went wrong on our side")).toBeTruthy();
    expect(within(alert).getByText("Request req-42")).toBeTruthy();

    fail = false;
    await user.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("table")).toBeTruthy();
  });

  it("marks Servers as the current page in the navigation", async () => {
    api.use(http.get(LIST, () => aPage([])));
    renderRoute("/");
    expect(await screen.findByRole("heading", { name: "Servers" })).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: "Services" });
    expect(within(nav).getByRole("link", { name: "Servers" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });
});

describe("create server", () => {
  function countPosts() {
    const posts: unknown[] = [];
    return {
      posts,
      handler: (reply: () => Response) =>
        http.post(LIST, async ({ request }) => {
          posts.push(await request.json());
          return reply();
        }),
    };
  }

  it("rejects an invalid name in the form, before any request", async () => {
    const { posts, handler } = countPosts();
    api.use(handler(() => HttpResponse.json(aServer(), { status: 202 })));
    const { user } = renderRoute("/servers/new");

    await user.type(screen.getByRole("textbox", { name: /Name/ }), "Web_1");
    expect(screen.getByText(/Use lowercase letters, digits and hyphens/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Create server" }));
    expect(posts).toEqual([]);
  });

  it("rejects an empty port", async () => {
    const { posts, handler } = countPosts();
    api.use(handler(() => HttpResponse.json(aServer(), { status: 202 })));
    const { user } = renderRoute("/servers/new");

    await user.type(screen.getByRole("textbox", { name: /Name/ }), "web-1");
    await user.clear(screen.getByRole("textbox", { name: /Container port/ }));
    await user.click(screen.getByRole("button", { name: "Create server" }));

    expect(await screen.findByText("Port must be a number")).toBeTruthy();
    expect(posts).toEqual([]);
  });

  it("creates the server, goes back to the list and says so", async () => {
    const created = aServer({ name: "web-1", status: "pending", outputs: {} });
    const { posts, handler } = countPosts();
    api.use(
      handler(() => HttpResponse.json(created, { status: 202 })),
      http.get(LIST, () => aPage([created])),
    );
    const { user, router } = renderRoute("/servers/new");

    await user.type(screen.getByRole("textbox", { name: /Name/ }), "web-1");
    await user.click(screen.getByRole("radio", { name: /whoami/ }));
    expect(screen.getByText("traefik/whoami:v1.11.0")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Create server" }));

    expect(await screen.findByText("web-1 is being created")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/servers");
    expect(posts).toEqual([{ name: "web-1", image: "whoami", port: 80 }]);
    expect(await screen.findByText("Waiting for a worker")).toBeTruthy();
  });

  it("shows a taken name under the Name field", async () => {
    api.use(
      http.post(LIST, () => anError(409, "name_taken", 'A server named "web-1" already exists')),
    );
    const { user } = renderRoute("/servers/new");

    await user.type(screen.getByRole("textbox", { name: /Name/ }), "web-1");
    await user.click(screen.getByRole("button", { name: "Create server" }));

    const message = await screen.findByText('A server named "web-1" already exists');
    // Under the field, linked to it for screen readers; no banner above the form.
    const name = screen.getByRole("textbox", { name: /Name/ });
    expect(name.getAttribute("aria-describedby")).toContain(message.id);
    expect(screen.queryByText("The server was not created")).toBeNull();
  });

  it("shows other API errors above the form", async () => {
    api.use(http.post(LIST, () => anError(503, "unavailable", "The database is down")));
    const { user } = renderRoute("/servers/new");

    await user.type(screen.getByRole("textbox", { name: /Name/ }), "web-1");
    await user.click(screen.getByRole("button", { name: "Create server" }));

    const message = await screen.findByText("The database is down");
    const alert = message.closest('[role="alert"]');
    if (!(alert instanceof HTMLElement)) throw new Error("the message is not in an alert");
    expect(within(alert).getByText("The server was not created")).toBeTruthy();
  });

  it("maps API validation details to known fields only", () => {
    const error = new ApiError({
      status: 400,
      code: "validation_failed",
      message: "The request is not valid",
      details: [
        { field: "port", message: "Port must be a whole number" },
        { field: "size", message: "Unknown field" },
      ],
    });
    expect(fieldErrorsFrom(error)).toEqual({ port: "Port must be a whole number" });
    expect(fieldErrorsFrom(new Error("boom"))).toEqual({});
  });

  it("cancels back to the list", async () => {
    renderRoute("/servers/new");
    const cancel = await screen.findByRole("link", { name: "Cancel" });
    expect(cancel.getAttribute("href")).toBe("/servers");
  });
});
