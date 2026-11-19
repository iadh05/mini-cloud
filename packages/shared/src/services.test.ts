import { describe, expect, it } from "vitest";
import {
  findService,
  isServiceId,
  SERVICE_CATEGORIES,
  SERVICE_IDS,
  SERVICE_STATUSES,
  SERVICES,
} from "./services.ts";

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

describe("service catalog", () => {
  it("has 39 services numbered 1 to 39 in order", () => {
    expect(SERVICES).toHaveLength(39);
    expect(SERVICES.map((s) => s.number)).toEqual(Array.from({ length: 39 }, (_, i) => i + 1));
  });

  it("has unique ids and API paths", () => {
    expect(new Set(SERVICE_IDS).size).toBe(39);
    expect(new Set(SERVICES.map((s) => s.path)).size).toBe(39);
  });

  it("uses kebab-case ids and paths", () => {
    for (const s of SERVICES) {
      expect(s.id).toMatch(KEBAB);
      expect(s.path).toMatch(KEBAB);
    }
  });

  it("uses only known categories, statuses and phases", () => {
    for (const s of SERVICES) {
      expect(SERVICE_CATEGORIES).toContain(s.category);
      expect(SERVICE_STATUSES).toContain(s.status);
      expect(s.phase).toBeGreaterThanOrEqual(2);
      expect(s.phase).toBeLessThanOrEqual(10);
    }
  });

  it("finds a service by id", () => {
    expect(findService("server")).toMatchObject({ name: "Servers", path: "servers", aws: "EC2" });
    expect(findService("spaceship")).toBeUndefined();
  });

  it("tells whether a string is a service id", () => {
    expect(isServiceId("bucket")).toBe(true);
    expect(isServiceId("Bucket")).toBe(false);
  });
});
