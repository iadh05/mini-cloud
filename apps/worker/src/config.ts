import { resolve } from "node:path";
import { z } from "zod";

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

/** The repository root. Relative paths in the environment are resolved from here. */
export const REPO_ROOT = resolve(import.meta.dirname, "../../..");

const configSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: "must be a postgres:// URL" }),
  BASE_DOMAIN: z
    .string()
    .regex(/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/, "must be a domain like mc.localhost")
    .default("mc.localhost"),
  RUNS_DIR: z.string().min(1).default("./var/runs"),
  TF_PLUGIN_CACHE_DIR: z.string().min(1).default("./var/tf-plugins"),
  MODULES_DIR: z.string().min(1).default("./infra/modules"),
  TERRAFORM_BIN: z.string().min(1).default("terraform"),
  POLL_INTERVAL_MS: z.coerce.number().int().min(100).default(2000),
  HEARTBEAT_TIMEOUT_S: z.coerce.number().int().min(5).default(30),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
});

export interface Config {
  databaseUrl: string;
  baseDomain: string;
  runsDir: string;
  pluginCacheDir: string;
  modulesDir: string;
  terraformBin: string;
  pollIntervalMs: number;
  /** A running job whose heartbeat is older than this goes back to the queue. */
  heartbeatTimeoutS: number;
  logLevel: (typeof LOG_LEVELS)[number];
}

export class ConfigError extends Error {
  override name = "ConfigError";
}

/** Reads and checks the environment once at startup; throws a readable list of problems. */
export function loadConfig(env: Record<string, string | undefined>, root = REPO_ROOT): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
    );
    throw new ConfigError(`Invalid configuration:\n${problems.join("\n")}`);
  }
  const c = result.data;
  return {
    databaseUrl: c.DATABASE_URL,
    baseDomain: c.BASE_DOMAIN,
    runsDir: resolve(root, c.RUNS_DIR),
    pluginCacheDir: resolve(root, c.TF_PLUGIN_CACHE_DIR),
    modulesDir: resolve(root, c.MODULES_DIR),
    terraformBin: c.TERRAFORM_BIN,
    pollIntervalMs: c.POLL_INTERVAL_MS,
    heartbeatTimeoutS: c.HEARTBEAT_TIMEOUT_S,
    logLevel: c.LOG_LEVEL,
  };
}
