// CLI entry point: `npm run db:migrate`.
import { runMigrations } from "../migrate.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (copy .env.example to .env)");
  process.exit(1);
}
await runMigrations(url);
console.warn("migrations applied");
