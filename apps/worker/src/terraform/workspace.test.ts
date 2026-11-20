import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { writeWorkspace } from "./workspace.ts";

describe("writeWorkspace", () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "mc-ws-"));
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("writes the module call as JSON and the values as tfvars", async () => {
    const dir = join(root, "var", "runs", "0193");
    await writeWorkspace({
      dir,
      moduleDir: join(root, "infra", "modules", "server"),
      variables: { name: "web-1", port: 80, cap_add: ["CHOWN"] },
      outputs: ["url", "container_id"],
    });

    const main: unknown = JSON.parse(await readFile(join(dir, "main.tf.json"), "utf8"));
    expect(main).toEqual({
      terraform: {
        required_providers: { docker: { source: "kreuzwerker/docker", version: "3.9.0" } },
      },
      provider: { docker: {} },
      variable: { name: {}, port: {}, cap_add: {} },
      module: {
        main: {
          source: "../../../infra/modules/server",
          name: "${var.name}",
          port: "${var.port}",
          cap_add: "${var.cap_add}",
        },
      },
      output: {
        url: { value: "${module.main.url}" },
        container_id: { value: "${module.main.container_id}" },
      },
    });

    const tfvars: unknown = JSON.parse(await readFile(join(dir, "terraform.tfvars.json"), "utf8"));
    expect(tfvars).toEqual({ name: "web-1", port: 80, cap_add: ["CHOWN"] });
  });

  it("prefixes a module below the run folder with ./", async () => {
    const dir = join(root, "run");
    await writeWorkspace({ dir, moduleDir: join(dir, "mod"), variables: {}, outputs: [] });

    const main = JSON.parse(await readFile(join(dir, "main.tf.json"), "utf8")) as {
      module: { main: { source: string } };
    };
    expect(main.module.main.source).toBe("./mod");
  });
});
