// Fails when a workspace or a console feature folder has no CLAUDE.md.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dirsIn = (path) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(path, entry.name))
    : [];

const required = [
  ".",
  ...dirsIn("apps"),
  ...dirsIn("packages"),
  "apps/dashboard/src/ui",
  ...dirsIn("apps/dashboard/src/features"),
];

const missing = required.filter((dir) => !existsSync(join(dir, "CLAUDE.md")));

if (missing.length > 0) {
  console.error(`Missing CLAUDE.md in:\n${missing.map((dir) => `  - ${dir}`).join("\n")}`);
  process.exit(1);
}
console.warn(`CLAUDE.md present in ${String(required.length)} folders`);
