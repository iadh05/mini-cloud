// Every workspace and every feature folder needs a CLAUDE.md that links to existing docs.
// A feature folder (apps/*/src/features/<service>/) must link to docs/services/<service>.md.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const dirsIn = (path) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(path, entry.name))
    : [];

const apps = dirsIn("apps");
const features = apps.flatMap((app) => dirsIn(join(app, "src", "features")));
const folders = [".", ...apps, ...dirsIn("packages"), "apps/dashboard/src/ui", ...features];

const problems = [];

for (const folder of folders) {
  const file = join(folder, "CLAUDE.md");
  if (!existsSync(file)) {
    problems.push(`${folder}: no CLAUDE.md`);
    continue;
  }
  const links = [...readFileSync(file, "utf8").matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)]
    .map((match) => match[1] ?? "")
    .filter((target) => !/^https?:/.test(target))
    .map((target) => normalize(join(dirname(file), target)));
  const docLinks = links.filter((target) => target.startsWith("docs/"));

  for (const target of links) {
    if (!existsSync(target)) problems.push(`${file}: broken link ${target}`);
  }
  if (docLinks.length === 0) problems.push(`${file}: no link to a doc in docs/`);

  if (features.includes(folder)) {
    const service = folder.split("/").pop() ?? "";
    const serviceDoc = `docs/services/${service}.md`;
    if (!docLinks.includes(serviceDoc)) problems.push(`${file}: must link to ${serviceDoc}`);
  }
}

if (problems.length > 0) {
  const list = problems.map((problem) => "  - " + problem).join("\n");
  console.error(`CLAUDE.md rule broken:\n${list}`);
  process.exit(1);
}
console.warn(`CLAUDE.md rule OK in ${String(folders.length)} folders`);
