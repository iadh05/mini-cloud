import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export interface TerraformResult {
  ok: boolean;
  /** Readable error when `ok` is false. */
  error?: string;
}

/** What the job runner needs from Terraform. Tests use a fake; production runs the CLI. */
export interface Terraform {
  init(dir: string, onLine: (line: string) => void): Promise<TerraformResult>;
  apply(dir: string, onLine: (line: string) => void): Promise<TerraformResult>;
  output(dir: string): Promise<Record<string, unknown>>;
}

export interface TerraformCliOptions {
  bin: string;
  /** Providers are downloaded once into this folder and reused by every run. */
  pluginCacheDir: string;
}

interface ProcessResult {
  code: number | null;
  stdout: string[];
  stderr: string[];
}

/** One line of `terraform apply -json` (machine-readable UI). */
interface JsonLine {
  "@level"?: string;
  "@message"?: string;
  type?: string;
  diagnostic?: { severity?: string; summary?: string; detail?: string };
}

function parseJsonLine(line: string): JsonLine | undefined {
  try {
    const value: unknown = JSON.parse(line);
    return typeof value === "object" && value !== null ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Turns `-json` lines into what a person reads, plus the error diagnostics. */
export function readApplyOutput(lines: readonly string[]): {
  messages: string[];
  errors: string[];
} {
  const messages: string[] = [];
  const errors: string[] = [];
  for (const line of lines) {
    const parsed = parseJsonLine(line);
    if (!parsed) {
      messages.push(line);
      continue;
    }
    if (parsed["@message"]) messages.push(parsed["@message"]);
    const d = parsed.diagnostic;
    if (parsed.type === "diagnostic" && d?.severity === "error") {
      errors.push([d.summary, d.detail].filter(Boolean).join(": "));
    }
  }
  return { messages, errors };
}

/** `terraform output -json` gives `{ name: { value, type, sensitive } }`; keep the values. */
export function outputValues(json: string): Record<string, unknown> {
  const parsed = JSON.parse(json) as Record<string, { value?: unknown }>;
  return Object.fromEntries(Object.entries(parsed).map(([name, out]) => [name, out.value]));
}

const lastLines = (lines: readonly string[], n = 5) =>
  lines
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-n)
    .join(" ");

/** Runs the Terraform CLI as a child process. */
export function createTerraformCli(options: TerraformCliOptions): Terraform {
  function run(dir: string, args: string[], onLine?: (line: string) => void) {
    return new Promise<ProcessResult>((resolvePromise, reject) => {
      const child = spawn(options.bin, args, {
        cwd: dir,
        env: {
          ...process.env,
          TF_PLUGIN_CACHE_DIR: options.pluginCacheDir,
          TF_IN_AUTOMATION: "1",
          TF_INPUT: "0",
        },
        stdio: ["ignore", "pipe", "pipe"],
        // Own process group: Ctrl+C on the worker does not interrupt a running apply.
        // The worker finishes the job (graceful shutdown) instead of leaving it half done.
        detached: true,
      });
      const result: ProcessResult = { code: null, stdout: [], stderr: [] };
      const collect = (stream: NodeJS.ReadableStream, into: string[]) => {
        createInterface({ input: stream }).on("line", (line) => {
          into.push(line);
          onLine?.(line);
        });
      };
      collect(child.stdout, result.stdout);
      collect(child.stderr, result.stderr);
      child.on("error", reject);
      child.on("close", (code) => {
        result.code = code;
        resolvePromise(result);
      });
    });
  }

  return {
    async init(dir, onLine) {
      const r = await run(dir, ["init", "-input=false", "-no-color"], onLine);
      if (r.code === 0) return { ok: true };
      return { ok: false, error: `terraform init failed: ${lastLines(r.stderr)}` };
    },

    async apply(dir, onLine) {
      // -lock-timeout: if a crashed worker's apply is still finishing, wait for it.
      const args = ["apply", "-auto-approve", "-input=false", "-json", "-lock-timeout=120s"];
      const r = await run(dir, args, (line) => {
        for (const message of readApplyOutput([line]).messages) onLine(message);
      });
      if (r.code === 0) return { ok: true };
      const { errors } = readApplyOutput([...r.stdout, ...r.stderr]);
      const reason = errors.length > 0 ? errors.join("; ") : lastLines(r.stderr);
      return { ok: false, error: reason || "terraform apply failed" };
    },

    async output(dir) {
      const r = await run(dir, ["output", "-json"]);
      if (r.code !== 0) throw new Error(`terraform output failed: ${lastLines(r.stderr)}`);
      return outputValues(r.stdout.join("\n"));
    },
  };
}
