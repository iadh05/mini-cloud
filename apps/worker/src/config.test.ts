import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig, REPO_ROOT } from "./config.ts";

const DATABASE_URL = "postgres://u:p@127.0.0.1:5432/db";

describe("loadConfig", () => {
  it("applies defaults and resolves paths from the repository root", () => {
    const config = loadConfig({ DATABASE_URL }, "/repo");

    expect(config).toEqual({
      databaseUrl: DATABASE_URL,
      baseDomain: "mc.localhost",
      runsDir: "/repo/var/runs",
      pluginCacheDir: "/repo/var/tf-plugins",
      modulesDir: "/repo/infra/modules",
      terraformBin: "terraform",
      pollIntervalMs: 2000,
      heartbeatTimeoutS: 30,
      logLevel: "info",
    });
  });

  it("keeps absolute paths and reads numbers", () => {
    const config = loadConfig({
      DATABASE_URL,
      RUNS_DIR: "/data/runs",
      POLL_INTERVAL_MS: "500",
      HEARTBEAT_TIMEOUT_S: "10",
    });

    expect(config.runsDir).toBe("/data/runs");
    expect(config.modulesDir.startsWith(REPO_ROOT)).toBe(true);
    expect(config.pollIntervalMs).toBe(500);
    expect(config.heartbeatTimeoutS).toBe(10);
  });

  it("lists every problem at once", () => {
    const load = () =>
      loadConfig({ DATABASE_URL: "mysql://x", BASE_DOMAIN: "Bad Domain", POLL_INTERVAL_MS: "1" });

    expect(load).toThrow(ConfigError);
    expect(load).toThrow(/DATABASE_URL: must be a postgres:\/\/ URL/);
    expect(load).toThrow(/BASE_DOMAIN: must be a domain/);
    expect(load).toThrow(/POLL_INTERVAL_MS/);
  });
});
