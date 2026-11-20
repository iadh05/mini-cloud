import type { Job } from "@mini-cloud/db";
import { pino } from "pino";
import { describe, expect, it, vi } from "vitest";
import { runLoop } from "./loop.ts";

const log = pino({ level: "silent" });
const job = (id: string) => ({ id }) as Job;

describe("runLoop", () => {
  it("runs jobs back to back, survives a claim error, stops when aborted", async () => {
    const controller = new AbortController();
    const queue: (Job | undefined | Error)[] = [job("a"), new Error("db down"), job("b")];
    const claim = vi.fn(() => {
      const next = queue.shift();
      if (next instanceof Error) return Promise.reject(next);
      if (!next) controller.abort();
      return Promise.resolve(next);
    });
    const ran: string[] = [];

    await runLoop({
      claim,
      run: (j) => {
        ran.push(j.id);
        return Promise.resolve();
      },
      intervalMs: 1,
      signal: controller.signal,
      log,
    });

    expect(ran).toEqual(["a", "b"]);
    expect(claim).toHaveBeenCalledTimes(4);
  });

  it("finishes the running job when aborted during it", async () => {
    const controller = new AbortController();
    let finished = false;

    await runLoop({
      claim: () => Promise.resolve(job("a")),
      run: async () => {
        controller.abort();
        await new Promise((resolve) => setTimeout(resolve, 10));
        finished = true;
      },
      intervalMs: 1,
      signal: controller.signal,
      log,
    });

    expect(finished).toBe(true);
  });
});
