import type { Resource } from "@mini-cloud/db";

export interface HandlerContext {
  baseDomain: string;
}

/**
 * What the worker needs to know about one service: which Terraform module to call,
 * with which inputs, and how to turn module outputs into `resources.outputs`.
 * One handler per service, in `features/<service>/`.
 */
export interface ResourceHandler {
  /** Folder name in `infra/modules/`. */
  module: string;
  /** Module inputs from the stored spec. Throws `UserError` if the spec is invalid. */
  variables(resource: Resource, ctx: HandlerContext): Record<string, unknown>;
  /** Module outputs to read after apply. */
  outputs: readonly string[];
  /** Module outputs → the service's `outputs` schema. */
  toOutputs(raw: Record<string, unknown>): Record<string, unknown>;
}
