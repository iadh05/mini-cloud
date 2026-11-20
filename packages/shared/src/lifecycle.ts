/** Status of a resource. See docs/ARCHITECTURE.md §5 and docs/services/<service>.md. */
export const RESOURCE_STATUSES = [
  "pending",
  "provisioning",
  "running",
  "updating",
  "starting",
  "stopping",
  "stopped",
  "deleting",
  "deleted",
  "failed",
] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

/** Statuses the worker is about to change; the console polls while one is shown. */
export const TRANSITIONAL_STATUSES = [
  "pending",
  "provisioning",
  "updating",
  "starting",
  "stopping",
  "deleting",
] as const satisfies readonly ResourceStatus[];

export function isTransitional(status: ResourceStatus): boolean {
  const transitional: readonly ResourceStatus[] = TRANSITIONAL_STATUSES;
  return transitional.includes(status);
}

/** What a job asks the worker to do. */
export const JOB_ACTIONS = ["create", "update", "delete", "start", "stop", "restart"] as const;
export type JobAction = (typeof JOB_ACTIONS)[number];

/** Where a job is in its own life. */
export const JOB_STATES = ["queued", "running", "done", "failed", "cancelled"] as const;
export type JobState = (typeof JOB_STATES)[number];

/** Days a soft-deleted resource stays restorable before it is purged. */
export const SOFT_DELETE_DAYS = 7;
