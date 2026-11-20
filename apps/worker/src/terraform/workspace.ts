import { mkdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

/** Pinned in every run folder; modules only set a minimum (`~> 3.9`). */
const DOCKER_PROVIDER = { source: "kreuzwerker/docker", version: "3.9.0" };

export interface WorkspaceInput {
  /** Run folder, one per resource: `RUNS_DIR/<resource-id>`. Holds the Terraform state. */
  dir: string;
  /** Absolute path of `infra/modules/<type>`. */
  moduleDir: string;
  /** Module inputs, already validated. */
  variables: Record<string, unknown>;
  /** Module outputs to expose with `terraform output`. */
  outputs: readonly string[];
}

/** Terraform wants local module sources to start with ./ or ../ and use forward slashes. */
function moduleSource(from: string, to: string): string {
  const path = relative(from, to).split(sep).join("/");
  return path.startsWith(".") ? path : `./${path}`;
}

/**
 * Writes the run folder:
 * - `main.tf.json`: provider, one variable per input, the module call, the outputs.
 * - `terraform.tfvars.json`: the values.
 *
 * Both are JSON, never HCL built from strings, and user values only go into tfvars.
 * Terraform reads tfvars values literally, so a value can never inject configuration.
 */
export async function writeWorkspace(input: WorkspaceInput): Promise<void> {
  const names = Object.keys(input.variables);
  const main = {
    terraform: { required_providers: { docker: DOCKER_PROVIDER } },
    provider: { docker: {} },
    variable: Object.fromEntries(names.map((name) => [name, {}])),
    module: {
      main: {
        source: moduleSource(input.dir, input.moduleDir),
        ...Object.fromEntries(names.map((name) => [name, `\${var.${name}}`])),
      },
    },
    output: Object.fromEntries(
      input.outputs.map((name) => [name, { value: `\${module.main.${name}}` }]),
    ),
  };

  await mkdir(input.dir, { recursive: true });
  await writeFile(join(input.dir, "main.tf.json"), `${JSON.stringify(main, null, 2)}\n`);
  await writeFile(
    join(input.dir, "terraform.tfvars.json"),
    `${JSON.stringify(input.variables, null, 2)}\n`,
  );
}
