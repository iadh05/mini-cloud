import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "./config.ts";

const DATABASE_URL = "postgres://u:p@localhost:5432/db";

describe("loadConfig", () => {
  it("uses defaults for everything but the database", () => {
    expect(loadConfig({ DATABASE_URL })).toEqual({
      databaseUrl: DATABASE_URL,
      host: "127.0.0.1",
      port: 3000,
      logLevel: "info",
    });
  });

  it("reads every variable", () => {
    const config = loadConfig({
      DATABASE_URL,
      API_HOST: "0.0.0.0",
      API_PORT: "8080",
      LOG_LEVEL: "debug",
    });
    expect(config).toMatchObject({ host: "0.0.0.0", port: 8080, logLevel: "debug" });
  });

  it("lists every problem in one readable error", () => {
    const run = () => loadConfig({ DATABASE_URL: "mysql://x", API_PORT: "99999" });
    expect(run).toThrow(ConfigError);
    expect(run).toThrow(/DATABASE_URL: must be a postgres:\/\/ URL/);
    expect(run).toThrow(/API_PORT/);
  });

  it("fails when DATABASE_URL is missing", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });
});
