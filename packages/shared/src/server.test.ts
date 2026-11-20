import { describe, expect, it } from "vitest";
import { resourceName } from "./resource-name.ts";
import {
  createServerInput,
  imageRef,
  SERVER_CAPABILITIES,
  SERVER_IMAGES,
  serverSpec,
} from "./server.ts";

const valid = { name: "web-1", image: "nginx", port: 80 };

/** The first error message for an input, or undefined when it is valid. */
function errorOf(input: unknown): string | undefined {
  const result = createServerInput.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("resourceName", () => {
  it.each(["web", "web-1", "a1b2c3", "my-api-server", "a".repeat(40)])("accepts %s", (name) => {
    expect(resourceName.safeParse(name).success).toBe(true);
  });

  it.each([
    ["too short", "ab"],
    ["too long", "a".repeat(41)],
    ["uppercase", "Web-1"],
    ["starts with a digit", "1web"],
    ["starts with a hyphen", "-web"],
    ["ends with a hyphen", "web-"],
    ["has an underscore", "web_1"],
    ["has a dot", "web.1"],
    ["has a space", "web 1"],
  ])("rejects a name that %s", (_, name) => {
    expect(resourceName.safeParse(name).success).toBe(false);
  });
});

describe("createServerInput", () => {
  it("accepts a valid server", () => {
    expect(createServerInput.parse(valid)).toEqual(valid);
  });

  it("rejects a name that is too short", () => {
    expect(errorOf({ ...valid, name: "ab" })).toBe("Name must be at least 3 characters");
  });

  it("rejects an uppercase name", () => {
    expect(errorOf({ ...valid, name: "Web" })).toMatch(/lowercase/);
  });

  it("rejects an image that is not in the allow-list", () => {
    expect(errorOf({ ...valid, image: "ubuntu" })).toBe(
      "Image must be one of: nginx, httpd, caddy, whoami",
    );
  });

  it.each([0, -1, 65_536])("rejects port %d", (port) => {
    expect(errorOf({ ...valid, port })).toBe("Port must be between 1 and 65535");
  });

  it("rejects a port that is not a whole number", () => {
    expect(errorOf({ ...valid, port: 80.5 })).toBe("Port must be a whole number");
  });

  it("rejects a port sent as text", () => {
    expect(errorOf({ ...valid, port: "80" })).toBe("Port must be a number");
  });

  it("rejects unknown fields", () => {
    expect(createServerInput.safeParse({ ...valid, privileged: true }).success).toBe(false);
  });

  it("requires every field", () => {
    expect(createServerInput.safeParse({}).success).toBe(false);
  });
});

describe("serverSpec", () => {
  it("is the stored part of the input, without the name", () => {
    expect(serverSpec.parse({ image: "whoami", port: 80 })).toEqual({ image: "whoami", port: 80 });
    expect(serverSpec.safeParse(valid).success).toBe(false);
  });
});

describe("images", () => {
  it("pins every image to an exact tag", () => {
    for (const image of Object.values(SERVER_IMAGES)) {
      expect(image.ref).toMatch(/:[\w.-]+$/);
      expect(image.ref).not.toMatch(/:latest$/);
    }
  });

  it("resolves an image id to its pinned reference", () => {
    expect(imageRef("nginx")).toBe("nginx:1.29-alpine");
  });

  it("only gives back capabilities from the allowed list", () => {
    for (const image of Object.values(SERVER_IMAGES)) {
      for (const cap of image.capabilities) expect(SERVER_CAPABILITIES).toContain(cap);
    }
  });
});
