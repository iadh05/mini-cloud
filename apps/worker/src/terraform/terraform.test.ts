import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTerraformCli, outputValues, readApplyOutput, type Terraform } from "./terraform.ts";

const DIAGNOSTIC = JSON.stringify({
  "@level": "error",
  "@message": "Error: Unable to pull image",
  type: "diagnostic",
  diagnostic: { severity: "error", summary: "Unable to pull image", detail: "manifest unknown" },
});

describe("readApplyOutput", () => {
  it("keeps the messages and collects error diagnostics", () => {
    const lines = [
      JSON.stringify({ "@level": "info", "@message": "Plan: 2 to add", type: "change_summary" }),
      JSON.stringify({ type: "diagnostic", diagnostic: { severity: "warning", summary: "w" } }),
      DIAGNOSTIC,
      "not json",
      "42",
    ];

    expect(readApplyOutput(lines)).toEqual({
      messages: ["Plan: 2 to add", "Error: Unable to pull image", "not json", "42"],
      errors: ["Unable to pull image: manifest unknown"],
    });
  });
});

const SITE = "http://a.mc.localhost";

describe("outputValues", () => {
  it("keeps only the values", () => {
    const json = JSON.stringify({ url: { value: SITE, type: "string", sensitive: false } });
    expect(outputValues(json)).toEqual({ url: SITE });
  });
});

// A fake `terraform` binary: control files in the run folder make a step fail.
const FAKE_TERRAFORM = `#!/bin/sh
case "$1" in
  init)
    [ -f fail-init ] && { echo "Error: Failed to query available provider packages" >&2; exit 1; }
    echo "cache=$TF_PLUGIN_CACHE_DIR automation=$TF_IN_AUTOMATION"
    echo "Terraform has been successfully initialized!" ;;
  apply)
    [ -f fail-apply ] && { echo '${DIAGNOSTIC}'; exit 1; }
    [ -f crash-apply ] && { echo "panic: boom" >&2; exit 2; }
    echo '{"@level":"info","@message":"Apply complete! Resources: 2 added","type":"change_summary"}' ;;
  output)
    [ -f fail-output ] && { echo "No state file" >&2; exit 1; }
    echo '{"url":{"value":"http://web-1.mc.localhost","type":"string","sensitive":false}}' ;;
esac
`;

describe.skipIf(process.platform === "win32")("Terraform CLI runner", () => {
  let dir: string;
  let terraform: Terraform;
  const lines: string[] = [];
  const onLine = (line: string) => lines.push(line);
  const touch = (name: string) => writeFile(join(dir, name), "");
  const remove = (name: string) => rm(join(dir, name), { force: true });

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "mc-tf-"));
    const bin = join(dir, "fake-terraform");
    await writeFile(bin, FAKE_TERRAFORM);
    await chmod(bin, 0o755);
    terraform = createTerraformCli({ bin, pluginCacheDir: "/cache" });
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("init: streams lines and passes the plugin cache", async () => {
    expect(await terraform.init(dir, onLine)).toEqual({ ok: true });
    expect(lines).toContain("cache=/cache automation=1");
  });

  it("init: failure gives the end of stderr", async () => {
    await touch("fail-init");
    const result = await terraform.init(dir, onLine);
    await remove("fail-init");

    expect(result).toEqual({
      ok: false,
      error: "terraform init failed: Error: Failed to query available provider packages",
    });
  });

  it("apply: streams readable messages", async () => {
    expect(await terraform.apply(dir, onLine)).toEqual({ ok: true });
    expect(lines).toContain("Apply complete! Resources: 2 added");
  });

  it("apply: failure gives the diagnostic", async () => {
    await touch("fail-apply");
    const result = await terraform.apply(dir, onLine);
    await remove("fail-apply");

    expect(result).toEqual({ ok: false, error: "Unable to pull image: manifest unknown" });
  });

  it("apply: failure without diagnostics gives the end of stderr", async () => {
    await touch("crash-apply");
    const result = await terraform.apply(dir, onLine);
    await remove("crash-apply");

    expect(result).toEqual({ ok: false, error: "panic: boom" });
  });

  it("output: returns the values, throws on failure", async () => {
    expect(await terraform.output(dir)).toEqual({ url: "http://web-1.mc.localhost" });

    await touch("fail-output");
    await expect(terraform.output(dir)).rejects.toThrow("terraform output failed: No state file");
    await remove("fail-output");
  });

  it("rejects when the binary does not exist", async () => {
    const missing = createTerraformCli({ bin: join(dir, "nope"), pluginCacheDir: "/cache" });
    await expect(missing.init(dir, onLine)).rejects.toThrow(/ENOENT/);
  });
});
