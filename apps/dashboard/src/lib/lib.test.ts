import { createServerInput } from "@mini-cloud/shared";
import { describe, expect, it } from "vitest";
import { fullDate, timeAgo } from "./format.ts";
import { zodValidate } from "./zod-form.ts";

const NOW = Date.parse("2026-11-20T12:00:00Z");
const ago = (seconds: number) => new Date(NOW - seconds * 1000).toISOString();

describe("timeAgo", () => {
  it("says how long ago, in words", () => {
    expect(timeAgo(ago(10), NOW)).toBe("just now");
    expect(timeAgo(ago(5 * 60), NOW)).toBe("5 minutes ago");
    expect(timeAgo(ago(2 * 3600), NOW)).toBe("2 hours ago");
    expect(timeAgo(ago(26 * 3600), NOW)).toBe("yesterday");
    expect(timeAgo(ago(400 * 24 * 3600), NOW)).toBe("last year");
  });

  it("gives the full date for tooltips", () => {
    expect(fullDate(ago(0))).toContain("2026");
  });
});

describe("zodValidate", () => {
  const validate = zodValidate(createServerInput);

  it("returns no errors for valid values", () => {
    expect(validate({ name: "web-1", image: "nginx", port: 80 })).toEqual({});
  });

  it("returns the first message per field", () => {
    expect(validate({ name: "A", image: "nginx", port: "" })).toEqual({
      name: "Name must be at least 3 characters",
      port: "Port must be a number",
    });
  });
});
