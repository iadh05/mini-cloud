import type { Resource } from "@mini-cloud/db";
import { describe, expect, it } from "vitest";
import { UserError } from "../../errors.ts";
import { findHandler } from "../registry.ts";
import { serverHandler } from "./servers.handler.ts";

const resource = (spec: Record<string, unknown>) =>
  ({ id: "0193a5b0-0000-7000-8000-cddd3ff47984", name: "web-1", spec }) as Resource;

describe("server handler", () => {
  it("is registered for the server type only", () => {
    expect(findHandler("server")).toBe(serverHandler);
    expect(findHandler("bucket")).toBeUndefined();
    expect(findHandler("toString")).toBeUndefined();
  });

  it("maps the spec to module inputs: pinned image and its measured capabilities", () => {
    const vars = serverHandler.variables(resource({ image: "nginx", port: 80 }), {
      baseDomain: "mc.localhost",
    });

    expect(vars).toEqual({
      resource_id: "0193a5b0-0000-7000-8000-cddd3ff47984",
      name: "web-1",
      image: "nginx:1.29-alpine",
      port: 80,
      base_domain: "mc.localhost",
      cap_add: ["CHOWN", "SETUID", "SETGID"],
    });
  });

  it("refuses an invalid spec with a readable message", () => {
    const run = () =>
      serverHandler.variables(resource({ image: "ubuntu", port: 0 }), { baseDomain: "x" });

    expect(run).toThrow(UserError);
    expect(run).toThrow(
      "The server spec is invalid: Image must be one of: nginx, httpd, caddy, whoami; Port must be between 1 and 65535",
    );
  });

  it("maps module outputs to the server outputs", () => {
    expect(
      serverHandler.toOutputs({ container_id: "abc", url: "http://web-1.mc.localhost" }),
    ).toEqual({ containerId: "abc", url: "http://web-1.mc.localhost" });
  });
});
