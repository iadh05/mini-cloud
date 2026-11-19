import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Local runs read DATABASE_URL from .env; CI sets it as an environment variable.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  test: {
    include: ["{apps,packages}/*/src/**/*.test.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      // Count every source file, not only the ones a test happens to load.
      include: ["{apps,packages}/*/src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/index.ts", // barrels and app entry points (wiring only)
        "**/src/bin/**", // command-line entry points
        "**/*.d.ts",
      ],
      reporter: ["text", "text-summary", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
