import { existsSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Local runs read DATABASE_URL from .env; CI sets it as an environment variable.
if (existsSync(".env")) process.loadEnvFile(".env");

const DASHBOARD = "apps/dashboard";

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          include: ["{apps,packages}/*/src/**/*.test.ts"],
          exclude: [`${DASHBOARD}/**`],
        },
      },
      {
        // The console: React components in a fake browser (jsdom), API faked with MSW.
        extends: true,
        plugins: [react()],
        test: {
          name: "dashboard",
          include: [`${DASHBOARD}/src/**/*.test.{ts,tsx}`],
          environment: "jsdom",
          setupFiles: [`${DASHBOARD}/test/setup.ts`],
        },
      },
    ],
    coverage: {
      provider: "v8",
      // Count every source file, not only the ones a test happens to load.
      include: ["{apps,packages}/*/src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/index.ts", // barrels and app entry points (wiring only)
        "**/main.tsx", // console entry point (wiring only)
        "**/src/bin/**", // command-line entry points
        "**/*.d.ts",
      ],
      reporter: ["text", "text-summary", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
