import { z } from "zod";

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

const configSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: "must be a postgres:// URL" }),
  API_HOST: z.string().min(1).default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
});

export interface Config {
  databaseUrl: string;
  host: string;
  port: number;
  logLevel: (typeof LOG_LEVELS)[number];
}

export class ConfigError extends Error {
  override name = "ConfigError";
}

/** Reads and checks the environment once at startup; throws a readable list of problems. */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
    );
    throw new ConfigError(`Invalid configuration:\n${problems.join("\n")}`);
  }
  const c = result.data;
  return { databaseUrl: c.DATABASE_URL, host: c.API_HOST, port: c.API_PORT, logLevel: c.LOG_LEVEL };
}
