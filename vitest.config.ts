import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Local runs read DATABASE_URL from .env; CI sets it as an environment variable.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  test: {
    include: ["{apps,packages}/*/src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
