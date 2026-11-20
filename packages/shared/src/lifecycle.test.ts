import { describe, expect, it } from "vitest";
import { isTransitional, RESOURCE_STATUSES } from "./lifecycle.ts";

describe("isTransitional", () => {
  it("is true only for statuses the worker is about to change", () => {
    const changing = RESOURCE_STATUSES.filter(isTransitional);
    expect(changing).toEqual([
      "pending",
      "provisioning",
      "updating",
      "starting",
      "stopping",
      "deleting",
    ]);
  });
});
