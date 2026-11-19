// Prints the coverage totals as a Markdown table (CI appends it to the job summary).
import { existsSync, readFileSync } from "node:fs";

const file = "coverage/coverage-summary.json";
if (!existsSync(file)) process.exit(0);

const { total } = JSON.parse(readFileSync(file, "utf8"));
const rows = ["lines", "statements", "functions", "branches"]
  .map((key) => `| ${key} | ${String(total[key].pct)}% |`)
  .join("\n");
process.stdout.write(`## Coverage\n\n| Metric | Covered |\n|---|---|\n${rows}\n`);
