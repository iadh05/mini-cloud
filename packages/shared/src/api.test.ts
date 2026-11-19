import { z } from "zod";
import { describe, expect, it } from "vitest";
import { apiErrorBody, idParams, page, pageQuery, resourceResponse } from "./api.ts";

describe("pageQuery", () => {
  it("defaults the limit to 20", () => {
    expect(pageQuery.parse({})).toEqual({ limit: 20 });
  });

  it("reads numbers from the query string", () => {
    expect(pageQuery.parse({ limit: "5" })).toEqual({ limit: 5 });
  });

  it.each(["0", "101", "abc"])("rejects limit=%s", (limit) => {
    expect(pageQuery.safeParse({ limit }).success).toBe(false);
  });

  it("only accepts a UUID cursor", () => {
    expect(pageQuery.safeParse({ cursor: "nope" }).success).toBe(false);
  });
});

describe("response schemas", () => {
  const item = resourceResponse(z.object({ port: z.number() }), z.object({}));
  const sample = {
    id: "0195a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b",
    type: "server",
    name: "web-1",
    status: "pending",
    spec: { port: 80 },
    outputs: {},
    error: null,
    createdAt: "2026-11-20T10:00:00.000Z",
    updatedAt: "2026-11-20T10:00:00.000Z",
  };

  it("accepts a resource", () => {
    expect(item.parse(sample)).toEqual(sample);
  });

  it("accepts a page with or without a next cursor", () => {
    expect(page(item).parse({ items: [sample], nextCursor: null }).items).toHaveLength(1);
    expect(page(item).safeParse({ items: [], nextCursor: sample.id }).success).toBe(true);
  });

  it("describes an error body", () => {
    const body = { error: { code: "not_found", message: "x", requestId: "r-1" } };
    expect(apiErrorBody.parse(body)).toEqual(body);
    expect(apiErrorBody.safeParse({ error: { code: "teapot" } }).success).toBe(false);
  });

  it("checks ids", () => {
    expect(idParams.safeParse({ id: "abc" }).success).toBe(false);
  });
});
