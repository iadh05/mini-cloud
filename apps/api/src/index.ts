// Entry point: read config, build the app, listen, shut down cleanly.
import { createDb } from "@mini-cloud/db";
import { buildApp } from "./app.ts";
import { ConfigError, loadConfig } from "./config.ts";

let config;
try {
  config = loadConfig(process.env);
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

const { db, close } = createDb({ url: config.databaseUrl });
const app = buildApp({ db, logger: { level: config.logLevel } });
app.addHook("onClose", close);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, "shutting down");
    app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error({ err: error }, "shutdown failed");
        process.exit(1);
      },
    );
  });
}

await app.listen({ host: config.host, port: config.port });
