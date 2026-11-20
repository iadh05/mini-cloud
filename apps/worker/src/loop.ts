import { setTimeout as sleep } from "node:timers/promises";
import type { Job } from "@mini-cloud/db";
import type { Logger } from "pino";

export interface LoopDeps {
  claim: () => Promise<Job | undefined>;
  run: (job: Job) => Promise<void>;
  intervalMs: number;
  /** Aborted on SIGTERM: claim nothing new, let the current job finish. */
  signal: AbortSignal;
  log: Logger;
}

/** Takes jobs one at a time; waits `intervalMs` when the queue is empty. */
export async function runLoop(deps: LoopDeps): Promise<void> {
  while (!deps.signal.aborted) {
    let job: Job | undefined;
    try {
      job = await deps.claim();
    } catch (error) {
      deps.log.error({ err: error }, "could not claim a job");
    }
    if (job) {
      await deps.run(job);
      continue;
    }
    await sleep(deps.intervalMs, undefined, { signal: deps.signal }).catch(() => undefined);
  }
}
