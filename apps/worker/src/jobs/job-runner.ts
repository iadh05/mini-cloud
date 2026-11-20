import { join } from "node:path";
import type { Job, Resource } from "@mini-cloud/db";
import type { Logger } from "pino";
import { INTERNAL_ERROR_MESSAGE, shorten, UserError } from "../errors.ts";
import { findHandler } from "../features/registry.ts";
import { LogTail } from "../log-tail.ts";
import type { Terraform } from "../terraform/terraform.ts";
import { writeWorkspace } from "../terraform/workspace.ts";
import type { JobStore } from "./job-store.ts";

/** A job taken over this many times (worker crashed every time) is given up. */
export const MAX_ATTEMPTS = 3;

export interface JobRunnerDeps {
  store: JobStore;
  terraform: Terraform;
  runsDir: string;
  modulesDir: string;
  baseDomain: string;
  log: Logger;
  /** How often a running job says "still working". Must be well below the heartbeat timeout. */
  heartbeatMs: number;
}

/**
 * Runs one claimed job to the end and records the result. Never throws: every failure
 * ends as `failed` with a message, so a resource never stays in `provisioning`.
 */
export function createJobRunner(deps: JobRunnerDeps) {
  async function provision(job: Job, resource: Resource, tail: LogTail, log: Logger) {
    const handler = findHandler(resource.type);
    if (!handler) throw new UserError(`The worker cannot provision "${resource.type}" yet`);

    const variables = handler.variables(resource, { baseDomain: deps.baseDomain });
    const dir = join(deps.runsDir, resource.id);
    await writeWorkspace({
      dir,
      moduleDir: join(deps.modulesDir, handler.module),
      variables,
      outputs: handler.outputs,
    });

    const onLine = (line: string) => {
      tail.push(line);
      log.debug({ terraform: line });
    };

    log.info({ dir, attempt: job.attempts }, "terraform init");
    const init = await deps.terraform.init(dir, onLine);
    if (!init.ok) throw new UserError(init.error ?? "terraform init failed");

    log.info("terraform apply");
    const apply = await deps.terraform.apply(dir, onLine);
    if (!apply.ok) throw new UserError(apply.error ?? "terraform apply failed");

    return handler.toOutputs(await deps.terraform.output(dir));
  }

  async function execute(job: Job, tail: LogTail, log: Logger): Promise<boolean> {
    if (job.attempts > MAX_ATTEMPTS) {
      throw new UserError(`Gave up after ${String(MAX_ATTEMPTS)} attempts`);
    }
    if (job.action !== "create") {
      throw new UserError(`The worker cannot run "${job.action}" jobs yet`);
    }
    const resource = await deps.store.startResource(job);
    if (!resource) throw new UserError("The resource was deleted or is not in a state to create");

    const outputs = await provision(job, resource, tail, log);
    return deps.store.succeed(job, outputs, tail.toString());
  }

  return async function run(job: Job): Promise<void> {
    const log = deps.log.child({ jobId: job.id, resourceId: job.resourceId });
    const tail = new LogTail(200);
    const beat = setInterval(() => {
      deps.store.heartbeat(job).catch((error: unknown) => {
        log.warn({ err: error }, "heartbeat failed");
      });
    }, deps.heartbeatMs);

    let recorded: boolean;
    try {
      recorded = await execute(job, tail, log);
      if (recorded) log.info("job done");
    } catch (error) {
      const userError = error instanceof UserError;
      const message = shorten(userError ? error.message : INTERNAL_ERROR_MESSAGE);
      if (userError) log.warn({ reason: error.message }, "job failed");
      else log.error({ err: error }, "job failed with an unexpected error");
      recorded = await deps.store.fail(job, message, tail.toString()).catch((e: unknown) => {
        log.error({ err: e }, "could not record the failure");
        return true;
      });
    } finally {
      clearInterval(beat);
    }
    if (!recorded) log.warn("another worker took over this job; result discarded");
  };
}

export type JobRunner = ReturnType<typeof createJobRunner>;
