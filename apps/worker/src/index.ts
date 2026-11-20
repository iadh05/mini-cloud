import { mkdir } from "node:fs/promises";
import { createDb } from "@mini-cloud/db";
import { pino } from "pino";
import { type Config, ConfigError, loadConfig } from "./config.ts";
import { createJobRunner } from "./jobs/job-runner.ts";
import { createJobStore } from "./jobs/job-store.ts";
import { runLoop } from "./loop.ts";
import { createTerraformCli } from "./terraform/terraform.ts";

function readConfig(): Config {
  try {
    return loadConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

const config = readConfig();

const log = pino({ level: config.logLevel, base: { service: "worker" } });
await mkdir(config.pluginCacheDir, { recursive: true });
await mkdir(config.runsDir, { recursive: true });

const { db, close } = createDb({ url: config.databaseUrl, max: 2 });
const store = createJobStore(db, { heartbeatTimeoutS: config.heartbeatTimeoutS });
const run = createJobRunner({
  store,
  terraform: createTerraformCli({
    bin: config.terraformBin,
    pluginCacheDir: config.pluginCacheDir,
  }),
  runsDir: config.runsDir,
  modulesDir: config.modulesDir,
  baseDomain: config.baseDomain,
  log,
  heartbeatMs: Math.floor((config.heartbeatTimeoutS * 1000) / 3),
});

// First SIGTERM/SIGINT: take no new job, finish the current one. Second: leave now.
// A job cut short is taken over by the next worker once its heartbeat is old.
const controller = new AbortController();
const stop = (signal: NodeJS.Signals) => {
  if (controller.signal.aborted) {
    log.warn({ signal }, "second signal, exiting now");
    process.exit(1);
  }
  log.info({ signal }, "stopping: finishing the current job");
  controller.abort();
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);

log.info({ runsDir: config.runsDir, pollMs: config.pollIntervalMs }, "worker started");
await runLoop({
  claim: () => store.claim(),
  run,
  intervalMs: config.pollIntervalMs,
  signal: controller.signal,
  log,
});
await close();
log.info("worker stopped");
